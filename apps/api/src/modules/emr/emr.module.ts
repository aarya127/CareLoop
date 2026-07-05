import { Module } from '@nestjs/common';
import { EmrService } from './emr.service';
import { EncountersController } from './encounters.controller';
import { MedicalHistoryController } from './medical-history.controller';
import { ChartingController } from './charting.controller';
import { TreatmentPlansController } from './treatment-plans.controller';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyService } from '../../common/services/idempotency.service';

@Module({
  imports: [AuditModule],
  controllers: [
    EncountersController,
    MedicalHistoryController,
    ChartingController,
    TreatmentPlansController,
  ],
  providers: [EmrService, IdempotencyService],
  exports: [EmrService],
})
export class EmrModule {}
