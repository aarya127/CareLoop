import { Controller, Get, Post, Param, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagingService } from './messaging.service';
import type { SendMessageDto, ScheduleReminderDto } from './dto';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations/:patientId')
  getConversation(@Param('patientId') patientId: string) {
    return this.messagingService.getConversation(patientId);
  }

  // Tighter rate limit: 20 sends per minute to prevent spam
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  send(
    @Body() dto: SendMessageDto,
    @Headers('x-actor-user-id') _actorUserId?: string,
  ) {
    return this.messagingService.send(dto);
  }

  @Post('reminders/schedule')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  scheduleReminder(@Body() dto: ScheduleReminderDto) {
    return this.messagingService.scheduleReminder(dto);
  }
}
