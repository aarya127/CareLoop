import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { RemindersService } from './reminders.service';
import { TwilioService } from './twilio.service';
import { EmailService } from './email.service';

@Module({
  controllers: [MessagingController],
  providers: [MessagingService, RemindersService, TwilioService, EmailService],
  exports: [MessagingService, RemindersService, TwilioService, EmailService],
})
export class MessagingModule {}
