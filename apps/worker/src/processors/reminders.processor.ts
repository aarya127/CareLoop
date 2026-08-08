import type { Job } from 'bullmq';
import Twilio from 'twilio';
import nodemailer from 'nodemailer';
import type { AppointmentReminderJobData } from '@careloop/shared';
import { prisma } from '@careloop/db';
import type { Prisma } from '@careloop/db';

// ── Audit helper ─────────────────────────────────────────────────────────────

async function auditReminder(
  practiceId: string,
  eventType: string,
  outcome: string,
  meta: Prisma.InputJsonValue,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        practiceId,
        eventType,
        outcome,
        authMethod: 'system',
        metadata: meta,
      },
    });
  } catch {
    /* audit writes must never crash the worker */
  }
}

// ── Provider helpers ─────────────────────────────────────────────────────────

async function sendSms(to: string, body: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
  const from = process.env.TWILIO_PHONE_NUMBER ?? '';
  if (!accountSid || !authToken || !from) throw new Error('Twilio credentials not configured');

  const client = Twilio(accountSid, authToken);
  const msg = await client.messages.create({ to, from, body });
  return msg.sid;
}

async function sendEmail(to: string, subject: string, html: string): Promise<string> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'CareLoop <no-reply@careloop.app>',
    to,
    subject,
    html,
  });
  return info.messageId as string;
}

// ── Processor ────────────────────────────────────────────────────────────────

/**
 * Processes queued reminder sends.
 * BullMQ will retry automatically (uses default attempts=3, exponential backoff)
 * on thrown errors, updating retryCount + failReason on each failure.
 */
export async function remindersProcessor(job: Job<AppointmentReminderJobData>): Promise<void> {
  const { reminderId, practiceId } = job.data;

  if (!reminderId) {
    job.log('No reminderId in job data — skipping DB update');
    return;
  }

  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, practiceId },
    select: { status: true, channel: true, metadata: true },
  });
  if (!reminder) throw new Error(`Reminder ${reminderId} not found for practice`);
  if (reminder.status === 'sent' || reminder.status === 'cancelled') {
    job.log(`[reminder:${reminderId}] already ${reminder.status}; skipping`);
    return;
  }

  const claimed = await prisma.reminder.updateMany({
    where: { id: reminderId, practiceId, status: { in: ['pending', 'failed'] } },
    data: { status: 'sending', failReason: null },
  });
  if (claimed.count !== 1) {
    job.log(`[reminder:${reminderId}] already claimed; skipping duplicate job`);
    return;
  }

  // The database is authoritative. Queue data is only a record locator and
  // must never be able to redirect a message or replace its content.
  const metadata = (reminder.metadata ?? {}) as Record<string, unknown>;
  const to = typeof metadata.to === 'string' ? metadata.to : '';
  const content = typeof metadata.body === 'string' ? metadata.body : '';
  const subject = typeof metadata.subject === 'string' ? metadata.subject : undefined;
  const effectiveChannel = reminder.channel;
  if (!to) {
    await prisma.reminder.updateMany({
      where: { id: reminderId, practiceId, status: 'sending' },
      data: { status: 'failed', failReason: 'Reminder has no destination' },
    });
    throw new Error(`Reminder ${reminderId} has no destination`);
  }
  if (effectiveChannel !== 'sms' && effectiveChannel !== 'email') {
    await prisma.reminder.updateMany({
      where: { id: reminderId, practiceId, status: 'sending' },
      data: { status: 'failed', failReason: 'Reminder has unsupported channel' },
    });
    throw new Error(`Reminder ${reminderId} has unsupported channel`);
  }

  job.log(`[reminder:${reminderId}] Sending via ${effectiveChannel}`);

  try {
    let messageId: string;
    if (effectiveChannel === 'email') {
      messageId = await sendEmail(
        to,
        subject ?? 'Your appointment reminder',
        content || '<p>You have an upcoming appointment.</p>',
      );
    } else {
      messageId = await sendSms(to, content || 'You have an upcoming appointment.');
    }

    await prisma.reminder.updateMany({
      where: { id: reminderId, practiceId, status: 'sending' },
      data: { status: 'sent', sentAt: new Date() },
    });

    void auditReminder(practiceId, 'reminder_sent', 'success', {
      reminderId,
      channel: effectiveChannel,
      messageId,
    } as Prisma.InputJsonValue);

    job.log(`[reminder:${reminderId}] Sent. messageId=${messageId}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await prisma.reminder
      .updateMany({
        where: { id: reminderId, practiceId, status: 'sending' },
        data: {
          status: 'failed',
          failReason: reason,
          retryCount: { increment: 1 },
        },
      })
      .catch(() => {}); // swallow so BullMQ can record the real error
    throw err; // re-throw so BullMQ applies retry/backoff
  }
}
