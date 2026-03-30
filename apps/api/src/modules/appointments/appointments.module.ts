import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { AvailabilityService } from './availability.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, AvailabilityService],
  exports: [AppointmentsService, AvailabilityService],
})
export class AppointmentsModule {}
