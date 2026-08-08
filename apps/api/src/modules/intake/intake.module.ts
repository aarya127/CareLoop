import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { IntakeRepository } from './intake.repository';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { IntakeTokenService } from './intake-token.service';

@Module({
  imports: [AuditModule],
  controllers: [IntakeController],
  providers: [IntakeService, IntakeRepository, IntakeTokenService, IdempotencyService],
  exports: [IntakeService],
})
export class IntakeModule {}
