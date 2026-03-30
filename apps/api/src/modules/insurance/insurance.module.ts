import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { InsuranceRepository } from './insurance.repository';

@Module({
  controllers: [InsuranceController],
  providers: [InsuranceService, InsuranceRepository],
  exports: [InsuranceService],
})
export class InsuranceModule {}
