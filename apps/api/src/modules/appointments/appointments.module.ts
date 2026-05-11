import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { AvailabilityService } from './availability.service';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyService } from '../../common/services/idempotency.service';

@Module({
  imports: [AuditModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentsRepository,
    AvailabilityService,
    IdempotencyService,
  ],
  exports: [AppointmentsService, AvailabilityService],
})
export class AppointmentsModule {}
