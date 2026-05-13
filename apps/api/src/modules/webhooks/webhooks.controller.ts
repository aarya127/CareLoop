import { Controller, Post, Body, Headers, Req, RawBodyRequest, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators';

/**
 * Webhook endpoints are @Public() (no session auth) but each verifies
 * its own provider-specific signature before trusting the payload.
 *
 * All handlers return 200 immediately and enqueue heavy work to BullMQ.
 * Rate-limited to 500/min per IP to prevent webhook flooding.
 */
@Controller('webhooks')
@Public()
@Throttle({ default: { limit: 500, ttl: 60000 } })
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Twilio SMS status callback / inbound SMS.
   * Twilio sends application/x-www-form-urlencoded.
   * Signature: X-Twilio-Signature over HMAC(url + sorted params).
   */
  @Post('twilio')
  @HttpCode(HttpStatus.OK)
  async handleTwilio(
    @Body() payload: Record<string, string>,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: FastifyRequest,
  ) {
    const url = `${process.env.API_BASE_URL ?? 'http://localhost:3001'}${req.url}`;
    await this.webhooksService.handleTwilio(payload, url, signature ?? '');
    return '<?xml version="1.0" encoding="UTF-8"?><Response/>';
  }

  /**
   * SendGrid event webhook (delivered, bounced, opened, etc.)
   * Signature: X-Twilio-Email-Event-Webhook-Signature (HMAC-SHA256).
   */
  @Post('email')
  @HttpCode(HttpStatus.OK)
  async handleEmail(
    @Body() payload: Record<string, unknown>,
    @Headers('x-twilio-email-event-webhook-signature') signature: string,
    @Req() req: FastifyRequest,
  ) {
    const rawBody = JSON.stringify((req as any).body);
    await this.webhooksService.handleEmail(payload, rawBody, signature ?? '');
    return { received: true };
  }

  /**
   * Google Calendar push notifications.
   * Auth: X-Goog-Channel-Token matches GOOGLE_CALENDAR_WEBHOOK_TOKEN env var.
   */
  @Post('calendar')
  @HttpCode(HttpStatus.OK)
  async handleCalendar(
    @Body() payload: Record<string, unknown>,
    @Headers('x-goog-channel-token') channelToken: string,
    @Headers('x-goog-resource-state') resourceState: string,
    @Headers('x-goog-channel-id') channelId: string,
  ) {
    await this.webhooksService.handleCalendar(payload, channelToken ?? '', resourceState ?? '', channelId ?? '');
    return { received: true };
  }

  /**
   * Stripe payment webhooks.
   * Signature: Stripe-Signature (t=timestamp,v1=HMAC).
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripe(
    @Body() payload: Record<string, unknown>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.webhooksService.handleStripe(payload, signature ?? '');
    return { received: true };
  }
}
