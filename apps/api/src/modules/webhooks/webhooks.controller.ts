import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  handleStripe(@Body() payload: any, @Headers('stripe-signature') sig: string) {
    return this.webhooksService.handleStripe(payload, sig);
  }

  @Post('twilio')
  handleTwilio(@Body() payload: any) {
    return this.webhooksService.handleTwilio(payload);
  }
}
