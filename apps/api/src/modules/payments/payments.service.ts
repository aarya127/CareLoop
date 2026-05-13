import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@careloop/db';
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

  listPayments(filter: PaymentFilter) {
    if (!filter.practiceId && !filter.patientId && !filter.invoiceId) {
      throw new BadRequestException('At least one of practiceId, patientId, or invoiceId is required');
    }
    return this.paymentsRepo.findAll(filter);
  }

  async getPayment(id: string) {
    const payment = await this.paymentsRepo.findById(id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  async createPayment(dto: CreatePaymentDto, idempotencyKey?: string, actorUserId?: string) {
    // --- Idempotency check ---
    if (idempotencyKey) {
      const cached = await this.idempotencyService.claim(idempotencyKey);
      if (cached) return cached.body;
    }

    // Validate invoice exists
    const invoice = await prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
    }
    if (invoice.status === 'void') {
      throw new BadRequestException('Cannot add payment to a voided invoice');
    }

    // Create payment + conditionally update invoice status atomically
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.paymentRecord.create({
        data: {
          practiceId: dto.practiceId,
          invoiceId: dto.invoiceId,
          patientId: dto.patientId,
          payerType: dto.payerType ?? 'patient',
          method: dto.method,
          amountCents: dto.amountCents,
          status: 'completed',
          transactionRef: dto.transactionRef,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          createdBy: actorUserId,
        } as any,
      });

      // Sum all completed payments (including the one we just created) to determine invoice status
      const agg = await tx.paymentRecord.aggregate({
        where: { invoiceId: dto.invoiceId, status: 'completed' },
        _sum: { amountCents: true },
      });
      const totalPaid = agg._sum.amountCents ?? 0;

      const newStatus = totalPaid >= invoice.totalAmountCents ? 'paid' : 'sent';
      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          status: newStatus,
          ...(newStatus === 'paid' && { paidAt: new Date() }),
        },
      });

      return newPayment;
    });

    await this.auditService.record({
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

    if (idempotencyKey) {
      await this.idempotencyService.complete(idempotencyKey, 201, payment);
    }

    return payment;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto, actorUserId?: string) {
    await this.getPayment(id);

    const payment = await this.paymentsRepo.update(id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.transactionRef !== undefined && { transactionRef: dto.transactionRef }),
      ...(dto.paidAt !== undefined && { paidAt: dto.paidAt ? new Date(dto.paidAt) : null }),
    });

    await this.auditService.record({
      eventType: 'payment_updated',
      outcome: 'success',
      actorUserId,
      metadata: { paymentId: id, changes: dto },
    });

    return payment;
  }
}
