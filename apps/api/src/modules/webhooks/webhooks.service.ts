import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@careloop/db';
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
        data: { provider, event, idempotencyKey, rawPayload: rawPayload as Prisma.InputJsonValue },
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

      const logId = await this.logInbound(
        'sendgrid',
        event,
        idempotencyKey,
        evt as Record<string, unknown>,
      );
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
    if (!expectedToken) {
      // Fail closed in production — without a configured token the channel is unauthenticated.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('GOOGLE_CALENDAR_WEBHOOK_TOKEN not set — rejecting calendar webhook');
        throw new BadRequestException('Calendar webhook not configured');
      }
      this.logger.warn(
        'GOOGLE_CALENDAR_WEBHOOK_TOKEN not set — skipping token check (non-production only)',
      );
    } else if (channelToken !== expectedToken) {
      this.logger.warn(`Invalid Google Calendar channel token for channel ${channelId}`);
      throw new BadRequestException('Invalid calendar webhook token');
    }

    const event = resourceState || 'sync';
    const idempotencyKey = `google_calendar:${channelId}:${event}:${Date.now()}`;

    const logId = await this.logInbound('google_calendar', event, idempotencyKey, {
      ...payload,
      channelId,
      resourceState,
    });
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

  async handleStripe(
    payload: Record<string, unknown>,
    signature: string,
    rawBody: string,
  ): Promise<void> {
    if (!signature) throw new BadRequestException('Missing Stripe-Signature');

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      // Fail closed in production — an unverified payment webhook is forgeable.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('STRIPE_WEBHOOK_SECRET not set — rejecting Stripe webhook');
        throw new BadRequestException('Stripe webhook not configured');
      }
      this.logger.warn(
        'STRIPE_WEBHOOK_SECRET not set — skipping signature validation (non-production only)',
      );
    } else if (!this.verifyStripeSignature(rawBody, signature, secret)) {
      this.logger.warn('Invalid Stripe webhook signature');
      throw new BadRequestException('Invalid Stripe signature');
    }

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

  /**
   * Verify a Stripe webhook signature per Stripe's documented scheme:
   * header is `t=<timestamp>,v1=<hmac>` and the signed payload is
   * `<timestamp>.<rawBody>` HMAC-SHA256'd with the endpoint secret. Includes a
   * 5-minute timestamp tolerance for replay protection. This mirrors
   * stripe.webhooks.constructEvent without pulling in the SDK.
   */
  private verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
    const crypto = require('crypto') as typeof import('crypto');

    let timestamp = '';
    const v1: string[] = [];
    for (const part of signatureHeader.split(',')) {
      const [key, value] = part.trim().split('=');
      if (key === 't') timestamp = value;
      else if (key === 'v1' && value) v1.push(value);
    }
    if (!timestamp || v1.length === 0) return false;

    const tsNum = Number(timestamp);
    const toleranceSeconds = 300;
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > toleranceSeconds) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex');
    const expectedBuf = Buffer.from(expected);

    return v1.some((sig) => {
      const sigBuf = Buffer.from(sig);
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    });
  }
}
