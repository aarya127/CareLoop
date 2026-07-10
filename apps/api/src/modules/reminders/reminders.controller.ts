import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('history')
  getHistory(
    @Req() req: any,
    @Query('patientId') patientId?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.remindersService.getHistory(req.user.practiceId, { patientId, channel, status, from, to });
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Req() req: any) {
    return this.remindersService.findByPatientId(req.user.practiceId, patientId);
  }

  @Get('appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    return this.remindersService.findByAppointmentId(req.user.practiceId, appointmentId);
  }

  @Get('pending')
  findPending(@Req() req: any) {
    return this.remindersService.findPending(req.user.practiceId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.remindersService.create(req.user.practiceId, dto);
  }

  /** Send a specific reminder immediately. Rate-limited to 20/min. */
  @Post(':id/send')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  sendNow(@Param('id') id: string, @Req() req: any) {
    return this.remindersService.sendNow(req.user.practiceId, id);
  }

  @Patch(':id/sent')
  markSent(@Param('id') id: string, @Req() req: any) {
    return this.remindersService.markSent(req.user.practiceId, id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.remindersService.cancel(req.user.practiceId, id);
  }
}
