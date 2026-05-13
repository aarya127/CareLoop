import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { prisma } from '../../config/database';
import { enqueueWebhook } from '../../jobs/producers';
import { TwilioService } from '../messaging/twilio.service';
import { EmailService } from '../messaging/email.service';
import { integrations } from '../../config/integrations';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService,
  ) {}

  // ── Idempotency + logging ────────────────────────────────────────────────

  /**
   * Create a WebhookLog row for the inbound event.
   * Returns null if this idempotencyKey was already processed (duplicate).
   * Returns the log row ID so the worker can update status.
   */
  private async logInbound(
    provider: string,
    event: string,
    idempotencyKey: string,
    rawPayload: Record<string, unknown>,
  ): Promise<string | null> {
    try {
      const log = await prisma.webhookLog.create({
        data: { provider, event, idempotencyKey, rawPayload },
      });
      return log.id;
    } catch (err: any) {
      // Unique constraint violation = duplicate
      if (err?.code === 'P2002') {
        this.logger.debug(`Duplicate webhook ignored: ${provider}/${event}/${idempotencyKey}`);
        return null;
      }
      throw err;
    }
  }

  // ── Twilio SMS webhook ───────────────────────────────────────────────────

  /**
   * Handle inbound Twilio status callback / inbound SMS.
   * Verifies the X-Twilio-Signature header using the HMAC of url + params.
   * Returns fast (200) — all processing is async via BullMQ.
   */
  async handleTwilio(
    payload: Record<string, string>,
    requestUrl: string,
    signature: string,
  ): Promise<void> {
    const valid = this.twilioService.validateSignature(requestUrl, payload, signature);
    if (!valid) {
      this.logger.warn(`Invalid Twilio signature for ${requestUrl}`);
      throw new BadRequestException('Invalid Twilio signature');
    }

    const event = payload['SmsStatus'] ?? payload['MessageStatus'] ?? 'inbound_sms';
    const idempotencyKey = `twilio:${payload['MessageSid'] ?? payload['SmsSid'] ?? Date.now()}`;

    const logId = await this.logInbound('twilio', event, idempotencyKey, payload);
    if (!logId) return; // duplicate

    await enqueueWebhook({
      provider: 'twilio',
      event,
      payload: payload as Record<string, unknown>,
      webhookLogId: logId,
      idempotencyKey,
    });
  }

  // ── SendGrid email webhook ───────────────────────────────────────────────

  /**
   * Handle SendGrid event webhook (delivered, bounced, opened, etc.).
   * Verifies HMAC signature using SENDGRID_WEBHOOK_SECRET.
   */
  async handleEmail(
    payload: Record<string, unknown>,
    rawBody: string,
    signature: string,
  ): Promise<void> {
    const valid = this.emailService.validateSendgridSignature(rawBody, signature);
    if (!valid) {
      this.logger.warn('Invalid SendGrid webhook signature');
      throw new BadRequestException('Invalid email webhook signature');
    }

    // SendGrid sends an array of events
    const events = Array.isArray(payload) ? payload : [payload];
    for (const evt of events) {
      const event = (evt as any).event ?? 'unknown';
      const messageId = (evt as any).sg_message_id ?? (evt as any).email ?? Date.now();
      const idempotencyKey = `sendgrid:${event}:${messageId}`;

      const logId = await this.logInbound('sendgrid', event, idempotencyKey, evt as Record<string, unknown>);
      if (!logId) continue;

      await enqueueWebhook({
        provider: 'sendgrid',
        event,
        payload: evt as Record<string, unknown>,
        webhookLogId: logId,
        idempotencyKey,
      });
    }
  }

  // ── Google Calendar push webhook ─────────────────────────────────────────

  /**
   * Handle Google Calendar push notifications.
   * Authenticates via X-Goog-Channel-Token matching GOOGLE_CALENDAR_WEBHOOK_TOKEN env var.
   */
  async handleCalendar(
    payload: Record<string, unknown>,
    channelToken: string,
    resourceState: string,
    channelId: string,
  ): Promise<void> {
    const expectedToken = integrations.google.calendarWebhookToken;
    if (expectedToken && channelToken !== expectedToken) {
      this.logger.warn(`Invalid Google Calendar channel token for channel ${channelId}`);
      throw new BadRequestException('Invalid calendar webhook token');
    }

    const event = resourceState || 'sync';
    const idempotencyKey = `google_calendar:${channelId}:${event}:${Date.now()}`;

    const logId = await this.logInbound('google_calendar', event, idempotencyKey, { ...payload, channelId, resourceState });
    if (!logId) return;

    await enqueueWebhook({
      provider: 'google_calendar',
      event,
      payload: { ...payload, channelId, resourceState },
      webhookLogId: logId,
      idempotencyKey,
    });
  }

  // ── Stripe webhook ───────────────────────────────────────────────────────

  async handleStripe(payload: Record<string, unknown>, signature: string): Promise<void> {
    // Stripe signature verification requires stripe SDK + STRIPE_WEBHOOK_SECRET
    // For now: log + enqueue; add stripe.webhooks.constructEvent() when Stripe is fully integrated
    if (!signature) throw new BadRequestException('Missing Stripe-Signature');

    const event = (payload as any).type ?? 'unknown';
    const stripeEventId = (payload as any).id ?? `stripe_${Date.now()}`;
    const idempotencyKey = `stripe:${stripeEventId}`;

    const logId = await this.logInbound('stripe', event, idempotencyKey, payload);
    if (!logId) return;

    await enqueueWebhook({
      provider: 'stripe',
      event,
      payload,
      webhookLogId: logId,
      idempotencyKey,
    });
  }
}
