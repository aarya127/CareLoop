import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto';
import type { BillingSummaryQuery, InvoiceFilter } from './dto';
import { RequireRole } from '../../common/guards';
import { FRONT_OFFICE_ROLES, MANAGEMENT_ROLES } from '../auth/auth.constants';

// Billing is a money function — front office only (clinical roles excluded).
@Controller('billing')
@RequireRole(...FRONT_OFFICE_ROLES)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  getBillingSummary(@Query() query: BillingSummaryQuery, @Req() req: any) {
    return this.billingService.getBillingSummary(req.user.practiceId, query);
  }

  @Get('invoices')
  listInvoices(@Query() query: InvoiceFilter, @Req() req: any) {
    return this.billingService.listInvoices(req.user.practiceId, query);
  }

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string, @Req() req: any) {
    return this.billingService.getInvoice(req.user.practiceId, id);
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    return this.billingService.createInvoice(req.user.practiceId, dto, req.user.id);
  }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Req() req: any) {
    return this.billingService.updateInvoice(req.user.practiceId, id, dto, req.user.id);
  }

  @Post('invoices/:id/send')
  sendInvoice(@Param('id') id: string, @Req() req: any) {
    return this.billingService.sendInvoice(req.user.practiceId, id, req.user.id);
  }

  @Post('invoices/:id/void')
  @RequireRole(...MANAGEMENT_ROLES) // voiding a record is destructive — admin/manager only
  voidInvoice(@Param('id') id: string, @Req() req: any) {
    return this.billingService.voidInvoice(req.user.practiceId, id, req.user.id);
  }
}
