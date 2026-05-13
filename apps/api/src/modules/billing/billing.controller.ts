import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import type { CreateInvoiceDto, UpdateInvoiceDto, BillingSummaryQuery, InvoiceFilter } from './dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  getBillingSummary(@Query() query: BillingSummaryQuery) {
    return this.billingService.getBillingSummary(query);
  }

  @Get('invoices')
  listInvoices(@Query() query: InvoiceFilter) {
    return this.billingService.listInvoices(query);
  }

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoice(id);
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  createInvoice(
    @Body() dto: CreateInvoiceDto,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.billingService.createInvoice(dto, actorUserId);
  }

  @Patch('invoices/:id')
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.billingService.updateInvoice(id, dto, actorUserId);
  }

  @Post('invoices/:id/send')
  sendInvoice(
    @Param('id') id: string,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.billingService.sendInvoice(id, actorUserId);
  }

  @Post('invoices/:id/void')
  voidInvoice(
    @Param('id') id: string,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.billingService.voidInvoice(id, actorUserId);
  }
}
