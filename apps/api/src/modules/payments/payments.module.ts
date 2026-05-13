import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyService } from '../../common/services/idempotency.service';

@Module({
  imports: [AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, IdempotencyService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
