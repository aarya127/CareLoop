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
import { PaymentsService } from './payments.service';
import type { CreatePaymentDto, UpdatePaymentDto, PaymentFilter } from './dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments(@Query() query: PaymentFilter) {
    return this.paymentsService.listPayments(query);
  }

  @Get(':id')
  getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createPayment(
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.paymentsService.createPayment(dto, idempotencyKey, actorUserId);
  }

  @Patch(':id')
  updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.paymentsService.updatePayment(id, dto, actorUserId);
  }
}
