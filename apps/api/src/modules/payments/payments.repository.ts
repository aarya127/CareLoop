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
