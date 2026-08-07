import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import type { CreatePaymentDto, UpdatePaymentDto, PaymentFilter } from './dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepo: PaymentsRepository,
    private readonly auditService: AuditService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  listPayments(practiceId: string, filter: PaymentFilter) {
    // Tenancy always from the session — override any client-supplied practiceId.
    return this.paymentsRepo.findAll({ ...filter, practiceId });
  }

  async getPayment(practiceId: string, id: string) {
    const payment = await this.paymentsRepo.findById(id);
    if (!payment || payment.practiceId !== practiceId) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async createPayment(
    practiceId: string,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
    actorUserId?: string,
  ) {
    const scopedIdempotencyKey = idempotencyKey
      ? `payments:${practiceId}:${idempotencyKey}`
      : undefined;
    if (scopedIdempotencyKey) {
      const cached = await this.idempotencyService.claim(scopedIdempotencyKey);
      if (cached) return cached.body;
    }

    let result;
    try {
      result = await this.paymentsRepo.createAndRecalculateInvoice({
        practiceId,
        invoiceId: dto.invoiceId,
        patientId: dto.patientId,
        payerType: dto.payerType ?? 'patient',
        method: dto.method,
        amountCents: dto.amountCents,
        status: 'completed',
        transactionRef: dto.transactionRef,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        createdBy: actorUserId,
      });
    } catch (error) {
      if (scopedIdempotencyKey) await this.idempotencyService.release(scopedIdempotencyKey);
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Payment transaction reference already processed');
      }
      throw error;
    }

    if (!result.ok) {
      if (scopedIdempotencyKey) await this.idempotencyService.release(scopedIdempotencyKey);
      if (result.reason === 'invoice_not_found') {
        throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
      }
      if (result.reason === 'invoice_void') {
        throw new BadRequestException('Cannot add payment to a voided invoice');
      }
      if (result.reason === 'patient_mismatch') {
        throw new BadRequestException('Payment patient must match the invoice patient');
      }
      throw new BadRequestException('Payment exceeds the invoice balance');
    }
    const payment = result.payment;

    await this.auditService.record({
      practiceId,
      eventType: 'payment_created',
      outcome: 'success',
      actorUserId,
      metadata: {
        paymentId: payment.id,
        invoiceId: dto.invoiceId,
        amountCents: dto.amountCents,
        method: dto.method,
      },
    });

    if (scopedIdempotencyKey) {
      await this.idempotencyService.complete(scopedIdempotencyKey, 201, payment);
    }

    return payment;
  }

  async updatePayment(practiceId: string, id: string, dto: UpdatePaymentDto, actorUserId?: string) {
    const result = await this.paymentsRepo.updateAndRecalculateInvoice(practiceId, id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.transactionRef !== undefined && { transactionRef: dto.transactionRef }),
      ...(dto.paidAt !== undefined && { paidAt: dto.paidAt ? new Date(dto.paidAt) : null }),
    });
    if (!result.ok) {
      if (result.reason === 'payment_not_found') {
        throw new NotFoundException(`Payment ${id} not found`);
      }
      throw new BadRequestException('Payment status would exceed the invoice balance');
    }
    const payment = result.payment;

    await this.auditService.record({
      practiceId,
      eventType: 'payment_updated',
      outcome: 'success',
      actorUserId,
      metadata: { paymentId: id, changes: dto },
    });

    return payment;
  }
}
