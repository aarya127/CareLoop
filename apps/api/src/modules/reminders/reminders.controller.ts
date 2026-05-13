import { Controller, Get, Post, Patch, Param, Body, Query, Headers } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('history')
  getHistory(
    @Query('practiceId') practiceId: string,
    @Query('patientId') patientId?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.remindersService.getHistory({ practiceId, patientId, channel, status, from, to });
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.remindersService.findByPatientId(patientId);
  }

  @Get('appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.remindersService.findByAppointmentId(appointmentId);
  }

  @Get('pending')
  findPending(@Query('practiceId') practiceId: string) {
    return this.remindersService.findPending(practiceId);
  }

  @Post()
  create(
    @Body() dto: any,
    @Headers('x-actor-user-id') _actorUserId?: string,
  ) {
    return this.remindersService.create(dto);
  }

  /** Send a specific reminder immediately. Rate-limited to 20/min. */
  @Post(':id/send')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  sendNow(@Param('id') id: string) {
    return this.remindersService.sendNow(id);
  }

  @Patch(':id/sent')
  markSent(@Param('id') id: string) {
    return this.remindersService.markSent(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.remindersService.cancel(id);
  }
}

