import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  listInvoices(@Query() query: any) {
    return this.billingService.listInvoices(query);
  }

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoice(id);
  }

  @Post('invoices')
  createInvoice(@Body() dto: any) {
    return this.billingService.createInvoice(dto);
  }

  @Post('invoices/:id/send')
  sendInvoice(@Param('id') id: string) {
    return this.billingService.sendInvoice(id);
  }
}
