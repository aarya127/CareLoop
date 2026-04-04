import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('stripe')
  handleStripe(@Body() payload: any, @Headers('stripe-signature') sig: string) {
    return this.webhooksService.handleStripe(payload, sig);
  }

  @Public()
  @Post('twilio')
  handleTwilio(@Body() payload: any) {
    return this.webhooksService.handleTwilio(payload);
  }
}
