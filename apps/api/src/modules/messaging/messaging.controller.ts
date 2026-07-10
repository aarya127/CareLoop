import { Controller, Get, Post, Param, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagingService } from './messaging.service';
import type { SendMessageDto, ScheduleReminderDto } from './dto';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations/:patientId')
  getConversation(@Param('patientId') patientId: string, @Req() req: any) {
    return this.messagingService.getConversation(req.user.practiceId, patientId);
  }

  // Tighter rate limit: 20 sends per minute to prevent spam
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  send(@Body() dto: SendMessageDto, @Req() req: any) {
    return this.messagingService.send(req.user.practiceId, dto);
  }

  @Post('reminders/schedule')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  scheduleReminder(@Body() dto: ScheduleReminderDto, @Req() req: any) {
    return this.messagingService.scheduleReminder(req.user.practiceId, dto);
  }
}
