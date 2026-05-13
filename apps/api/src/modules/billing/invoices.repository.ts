import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';
import type { InvoiceFilter } from './dto';

@Injectable()
export class InvoicesRepository {
  findAll(filter: InvoiceFilter) {
    const where: Prisma.InvoiceWhereInput = {};
    if (filter.practiceId) where.practiceId = filter.practiceId;
    if (filter.patientId) where.patientId = filter.patientId;
    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = new Date(filter.from);
      if (filter.to) where.createdAt.lte = new Date(filter.to);
    }
    return prisma.invoice.findMany({
      where,
      include: {
        payments: { select: { id: true, amountCents: true, method: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });
  }

  create(data: Prisma.InvoiceUncheckedCreateInput) {
    return prisma.invoice.create({ data });
  }

  update(id: string, data: Prisma.InvoiceUncheckedUpdateInput) {
    return prisma.invoice.update({ where: { id }, data });
  }

  /**
   * Billing summary — aggregate totals for a practice (optionally scoped to patient).
   * Returns raw counts and cents aggregated via Prisma groupBy.
   *
   * NOTE: These totals are good candidates for denormalization into a
   * PracticeKpi / daily snapshot table so dashboards can query a single row
   * instead of scanning all invoices. Track with the existing KpiRecord model.
   */
  async summary(practiceId: string, patientId?: string, from?: string, to?: string) {
    const where: Prisma.InvoiceWhereInput = { practiceId };
    if (patientId) where.patientId = patientId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: { id: true, totalAmountCents: true, status: true },
      }),
      prisma.paymentRecord.findMany({
        where: { practiceId, ...(patientId ? { patientId } : {}), status: 'completed' },
        select: { amountCents: true },
      }),
    ]);

    const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmountCents, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amountCents, 0);
    const outstanding = invoices
      .filter((i) => !['paid', 'void'].includes(i.status))
      .reduce((s, i) => s + i.totalAmountCents, 0);
    const overdue = invoices.filter((i) => i.status === 'overdue').length;
    const byStatus = invoices.reduce<Record<string, number>>((acc, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalInvoicedCents: totalInvoiced,
      totalPaidCents: totalPaid,
      outstandingCents: outstanding,
      overdueCount: overdue,
      invoiceCount: invoices.length,
      byStatus,
      // Denormalization note: outstanding + totalPaid per practice can be snapshotted
      // daily into KpiRecord(metricName='billing_outstanding', kpiDate, value) for O(1) dashboard reads.
    };
  }
}
