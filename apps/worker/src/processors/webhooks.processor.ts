import type { Job } from 'bullmq';
import type { ProcessWebhookJobData } from '@careloop/shared';
import { prisma } from '@careloop/db';

// ── Event handlers ───────────────────────────────────────────────────────────

async function handleTwilioEvent(event: string, payload: Record<string, unknown>) {
  // Update Reminder status based on Twilio delivery receipt
  const messageSid = payload['MessageSid'] ?? payload['SmsSid'];
  const smsStatus = payload['SmsStatus'] ?? payload['MessageStatus'];

  if (!messageSid || !smsStatus) return;

  if (smsStatus === 'delivered') {
    // Find reminder by transactionRef (messageId) if stored in metadata
    // For now, log — the reminder was already marked sent at dispatch time
    console.info(`[webhook:twilio] Message ${messageSid} delivered`);
  } else if (smsStatus === 'failed' || smsStatus === 'undelivered') {
    console.warn(`[webhook:twilio] Message ${messageSid} failed: ${payload['ErrorCode']}`);
  }
}

async function handleSendgridEvent(event: string, payload: Record<string, unknown>) {
  const email = payload['email'] as string | undefined;
  const sgEvent = payload['event'] as string | undefined;
  console.info(`[webhook:sendgrid] ${sgEvent ?? event} for ${email}`);
  // Future: update Reminder.status based on bounced / spam report events
}

async function handleCalendarEvent(event: string, payload: Record<string, unknown>) {
  const channelId = payload['channelId'] as string | undefined;
  const resourceState = payload['resourceState'] as string | undefined;
  console.info(`[webhook:calendar] state=${resourceState} channel=${channelId}`);
  // Future: re-sync appointments for this practice when Google Calendar changes
}

async function handleStripeEvent(event: string, payload: Record<string, unknown>) {
  // Future: update PaymentRecord / Invoice status from Stripe events
  console.info(`[webhook:stripe] ${event} id=${(payload as any).id}`);
}

// ── Main processor ───────────────────────────────────────────────────────────

export async function webhooksProcessor(
  job: Job<ProcessWebhookJobData>,
): Promise<void> {
  const { provider, event, payload, webhookLogId, idempotencyKey } = job.data;
  job.log(`[webhook] processing ${provider}/${event} log=${webhookLogId}`);

  try {
    switch (provider) {
      case 'twilio':
        await handleTwilioEvent(event, payload);
        break;
      case 'sendgrid':
        await handleSendgridEvent(event, payload);
        break;
      case 'google_calendar':
        await handleCalendarEvent(event, payload);
        break;
      case 'stripe':
        await handleStripeEvent(event, payload);
        break;
      default:
        job.log(`Unknown provider: ${provider}`);
    }

    // Mark log as processed
    if (webhookLogId) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { status: 'processed', processedAt: new Date() },
      }).catch(() => {});
    }

    job.log(`[webhook] done ${provider}/${event}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    if (webhookLogId) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { status: 'failed', error: reason },
      }).catch(() => {});
    }
    throw err; // re-throw so BullMQ retries
  }
}
