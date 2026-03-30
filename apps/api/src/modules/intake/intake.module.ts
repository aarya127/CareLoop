import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { IntakeRepository } from './intake.repository';

@Module({
  controllers: [IntakeController],
  providers: [IntakeService, IntakeRepository],
  exports: [IntakeService],
})
export class IntakeModule {}
