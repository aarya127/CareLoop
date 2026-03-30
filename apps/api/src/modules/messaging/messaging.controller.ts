import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations/:patientId')
  getConversation(@Param('patientId') patientId: string) {
    return this.messagingService.getConversation(patientId);
  }

  @Post('send')
  send(@Body() dto: any) {
    return this.messagingService.send(dto);
  }

  @Post('reminders')
  scheduleReminder(@Body() dto: any) {
    return this.messagingService.scheduleReminder(dto);
  }
}
