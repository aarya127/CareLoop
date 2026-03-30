import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  createIntent(@Body() dto: any) {
    return this.paymentsService.createIntent(dto);
  }

  @Post('confirm')
  confirm(@Body() dto: any) {
    return this.paymentsService.confirm(dto);
  }

  @Get('history/:patientId')
  history(@Param('patientId') patientId: string) {
    return this.paymentsService.getHistory(patientId);
  }
}
