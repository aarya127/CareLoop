import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { InvoicesRepository } from './invoices.repository';

@Module({
  controllers: [BillingController],
  providers: [BillingService, InvoicesRepository],
  exports: [BillingService],
})
export class BillingModule {}
