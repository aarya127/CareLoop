import { Injectable } from '@nestjs/common';
import { integrations } from '../../config/integrations';

@Injectable()
export class TwilioService {
  async sendSms(to: string, body: string): Promise<void> {
    if (!integrations.twilio.accountSid) throw new Error('Twilio not configured');
    // TODO: integrate Twilio client
    void to; void body;
    throw new Error('Not implemented');
  }
}
