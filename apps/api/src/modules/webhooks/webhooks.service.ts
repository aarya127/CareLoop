import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhooksService {
  async handleStripe(_payload: any, _signature: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async handleTwilio(_payload: any): Promise<void> {
    throw new Error('Not implemented');
  }
}
