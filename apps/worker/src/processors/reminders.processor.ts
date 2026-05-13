import type { Job } from 'bullmq';
import Twilio from 'twilio';
import nodemailer from 'nodemailer';
import type { AppointmentReminderJobData } from '@careloop/shared';
import { prisma } from '@careloop/db';
import type { Prisma } from '@careloop/db';

// ── Audit helper ─────────────────────────────────────────────────────────────

async function auditReminder(eventType: string, outcome: string, meta: Prisma.InputJsonValue): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        eventType,
        outcome,
        authMethod: 'system',
        metadata: meta,
      },
    });
  } catch { /* audit writes must never crash the worker */ }
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
export async function remindersProcessor(
  job: Job<AppointmentReminderJobData>,
): Promise<void> {
  const { reminderId, channel, to, content, reminderType } = job.data;
  const effectiveChannel = channel ?? reminderType ?? 'sms';

  job.log(`[reminder:${reminderId}] Sending via ${effectiveChannel} to ${to}`);

  if (!reminderId) {
    job.log('No reminderId in job data — skipping DB update');
    return;
  }

  try {
    let messageId: string;
    if (effectiveChannel === 'email') {
      messageId = await sendEmail(
        to,
        (job.data as any).subject ?? 'Your appointment reminder',
        content || '<p>You have an upcoming appointment.</p>',
      );
    } else {
      messageId = await sendSms(to, content || 'You have an upcoming appointment.');
    }

    await prisma.reminder.update({
      where: { id: reminderId },
      data: { status: 'sent', sentAt: new Date() },
    });

    void auditReminder('reminder_sent', 'success', {
      reminderId,
      channel: effectiveChannel,
      messageId,
    } as Prisma.InputJsonValue);

    job.log(`[reminder:${reminderId}] Sent. messageId=${messageId}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await prisma.reminder
      .update({
        where: { id: reminderId },
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
