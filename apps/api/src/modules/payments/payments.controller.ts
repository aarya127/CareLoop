import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';
import type { PaymentFilter } from './dto';
import { RequireRole } from '../../common/guards';
import { FRONT_OFFICE_ROLES } from '../auth/auth.constants';

// Payments is a money function — front office only (clinical roles excluded).
@Controller('payments')
@RequireRole(...FRONT_OFFICE_ROLES)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments(@Query() query: PaymentFilter, @Req() req: any) {
    return this.paymentsService.listPayments(req.user.practiceId, query);
  }

  @Get(':id')
  getPayment(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.getPayment(req.user.practiceId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createPayment(
    @Body() dto: CreatePaymentDto,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // practiceId + actor come from the session, never from client headers/body.
    return this.paymentsService.createPayment(req.user.practiceId, dto, idempotencyKey, req.user.id);
  }

  @Patch(':id')
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @Req() req: any) {
    return this.paymentsService.updatePayment(req.user.practiceId, id, dto, req.user.id);
  }
}
