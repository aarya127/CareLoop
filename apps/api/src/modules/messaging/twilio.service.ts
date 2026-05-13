import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';
import { integrations } from '../../config/integrations';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);

  private get client(): Twilio.Twilio {
    const { accountSid, authToken } = integrations.twilio;
    if (!accountSid || !authToken) throw new Error('Twilio credentials not configured');
    return Twilio(accountSid, authToken);
  }

  async sendSms(to: string, body: string): Promise<string> {
    const { phoneNumber } = integrations.twilio;
    if (!phoneNumber) throw new Error('TWILIO_PHONE_NUMBER not configured');

    const message = await this.client.messages.create({ to, from: phoneNumber, body });
    this.logger.log(`SMS sent to ${to}: ${message.sid}`);
    return message.sid;
  }

  /**
   * Verify an inbound Twilio request signature.
   * Call this in the webhook controller before processing.
   * https://www.twilio.com/docs/usage/webhooks/webhooks-security
   */
  validateSignature(url: string, params: Record<string, string>, signature: string): boolean {
    const { authToken } = integrations.twilio;
    if (!authToken) {
      this.logger.warn('Twilio authToken not set — skipping signature validation');
      return true; // fail-open in dev; tighten in prod via env guard
    }
    return Twilio.validateRequest(authToken, signature, url, params);
  }
}
