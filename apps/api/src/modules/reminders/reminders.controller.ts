import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

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
  create(@Body() dto: any) {
    return this.remindersService.create(dto);
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
