import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';
import type { PaymentFilter } from './dto';

@Injectable()
export class PaymentsRepository {
  findAll(filter: PaymentFilter) {
    const where: Prisma.PaymentRecordWhereInput = {};
    if (filter.practiceId) where.practiceId = filter.practiceId;
    if (filter.patientId) where.patientId = filter.patientId;
    if (filter.invoiceId) where.invoiceId = filter.invoiceId;
    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = new Date(filter.from);
      if (filter.to) where.createdAt.lte = new Date(filter.to);
    }
    return prisma.paymentRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.paymentRecord.findUnique({ where: { id } });
  }

  create(data: Prisma.PaymentRecordUncheckedCreateInput) {
    return prisma.paymentRecord.create({ data });
  }

  update(id: string, data: Prisma.PaymentRecordUncheckedUpdateInput) {
    return prisma.paymentRecord.update({ where: { id }, data });
  }

  async createAndRecalculateInvoice(
    data: Prisma.PaymentRecordUncheckedCreateInput,
  ): Promise<
    | { ok: true; payment: Awaited<ReturnType<typeof prisma.paymentRecord.create>> }
    | {
        ok: false;
        reason: 'invoice_not_found' | 'invoice_void' | 'patient_mismatch' | 'overpayment';
      }
  > {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.practiceId}), hashtext(${data.invoiceId}))`;

      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, practiceId: data.practiceId },
        select: { id: true, patientId: true, status: true, totalAmountCents: true },
      });
      if (!invoice) return { ok: false as const, reason: 'invoice_not_found' as const };
      if (invoice.status === 'void') return { ok: false as const, reason: 'invoice_void' as const };
      if (invoice.patientId !== data.patientId) {
        return { ok: false as const, reason: 'patient_mismatch' as const };
      }

      const existing = await tx.paymentRecord.aggregate({
        where: { invoiceId: invoice.id, status: 'completed' },
        _sum: { amountCents: true },
      });
      const totalAfterPayment = (existing._sum.amountCents ?? 0) + data.amountCents;
      if (totalAfterPayment > invoice.totalAmountCents) {
        return { ok: false as const, reason: 'overpayment' as const };
      }

      const payment = await tx.paymentRecord.create({ data });
      const paid = totalAfterPayment === invoice.totalAmountCents;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: paid ? 'paid' : 'sent', paidAt: paid ? new Date() : null },
      });
      return { ok: true as const, payment };
    });
  }

  async updateAndRecalculateInvoice(
    practiceId: string,
    paymentId: string,
    data: Prisma.PaymentRecordUncheckedUpdateInput,
  ): Promise<
    | { ok: true; payment: Awaited<ReturnType<typeof prisma.paymentRecord.update>> }
    | { ok: false; reason: 'payment_not_found' | 'overpayment' }
  > {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.paymentRecord.findFirst({
        where: { id: paymentId, practiceId },
        select: { invoiceId: true, amountCents: true, status: true },
      });
      if (!existing) return { ok: false as const, reason: 'payment_not_found' as const };

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${practiceId}), hashtext(${existing.invoiceId}))`;
      const [invoice, otherPayments] = await Promise.all([
        tx.invoice.findFirst({
          where: { id: existing.invoiceId, practiceId },
          select: { id: true, totalAmountCents: true },
        }),
        tx.paymentRecord.aggregate({
          where: {
            invoiceId: existing.invoiceId,
            id: { not: paymentId },
            status: 'completed',
          },
          _sum: { amountCents: true },
        }),
      ]);
      if (!invoice) return { ok: false as const, reason: 'payment_not_found' as const };

      const resultingStatus = typeof data.status === 'string' ? data.status : existing.status;
      const thisAmount = resultingStatus === 'completed' ? existing.amountCents : 0;
      const totalPaid = (otherPayments._sum.amountCents ?? 0) + thisAmount;
      if (totalPaid > invoice.totalAmountCents) {
        return { ok: false as const, reason: 'overpayment' as const };
      }

      const payment = await tx.paymentRecord.update({ where: { id: paymentId }, data });
      const paid = totalPaid === invoice.totalAmountCents;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: paid ? 'paid' : 'sent', paidAt: paid ? new Date() : null },
      });
      return { ok: true as const, payment };
    });
  }

  /**
   * Sum of completed payments for an invoice — used to determine if invoice
   * should transition to 'paid'. Called inside a transaction for strong consistency.
   */
  sumCompletedForInvoice(invoiceId: string, tx: Prisma.TransactionClient = prisma) {
    return tx.paymentRecord.aggregate({
      where: { invoiceId, status: 'completed' },
      _sum: { amountCents: true },
    });
  }
}
