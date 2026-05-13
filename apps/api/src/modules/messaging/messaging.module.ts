import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { TwilioService } from './twilio.service';
import { EmailService } from './email.service';

@Module({
  controllers: [MessagingController],
  providers: [MessagingService, TwilioService, EmailService],
  exports: [MessagingService, TwilioService, EmailService],
})
export class MessagingModule {}
