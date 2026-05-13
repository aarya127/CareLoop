import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicesRepository } from './invoices.repository';
import { AuditService } from '../audit/audit.service';
import type { CreateInvoiceDto, UpdateInvoiceDto, BillingSummaryQuery, InvoiceFilter } from './dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly invoicesRepo: InvoicesRepository,
    private readonly auditService: AuditService,
  ) {}

  listInvoices(filter: InvoiceFilter) {
    if (!filter.practiceId && !filter.patientId) {
      throw new BadRequestException('Either practiceId or patientId is required');
    }
    return this.invoicesRepo.findAll(filter);
  }

  async getInvoice(id: string) {
    const invoice = await this.invoicesRepo.findById(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async createInvoice(dto: CreateInvoiceDto, actorUserId?: string) {
    const invoice = await this.invoicesRepo.create({
      practiceId: dto.practiceId,
      patientId: dto.patientId,
      treatmentId: dto.treatmentId,
      payerType: dto.payerType ?? 'patient',
      totalAmountCents: dto.totalAmountCents,
      lineItems: dto.lineItems as any,
      notes: dto.notes,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: 'draft',
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    await this.auditService.record({
      eventType: 'invoice_created',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: invoice.id, practiceId: dto.practiceId, patientId: dto.patientId },
    });

    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, actorUserId?: string) {
    await this.getInvoice(id);

    const invoice = await this.invoicesRepo.update(id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.payerType !== undefined && { payerType: dto.payerType }),
      ...(dto.totalAmountCents !== undefined && { totalAmountCents: dto.totalAmountCents }),
      ...(dto.lineItems !== undefined && { lineItems: dto.lineItems as any }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
      ...(dto.paidAt !== undefined && { paidAt: dto.paidAt ? new Date(dto.paidAt) : null }),
      updatedBy: actorUserId,
    });

    await this.auditService.record({
      eventType: 'invoice_updated',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: id, changes: dto },
    });

    return invoice;
  }

  async sendInvoice(id: string, actorUserId?: string) {
    const existing = await this.getInvoice(id);
    if (existing.status === 'void') {
      throw new BadRequestException('Cannot send a voided invoice');
    }

    const invoice = await this.invoicesRepo.update(id, {
      status: 'sent',
      issuedAt: new Date(),
      updatedBy: actorUserId,
    });

    await this.auditService.record({
      eventType: 'invoice_sent',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: id },
    });

    return invoice;
  }

  async voidInvoice(id: string, actorUserId?: string) {
    await this.getInvoice(id);

    const invoice = await this.invoicesRepo.update(id, {
      status: 'void',
      updatedBy: actorUserId,
    });

    await this.auditService.record({
      eventType: 'invoice_voided',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: id },
    });

    return invoice;
  }

  async getBillingSummary(query: BillingSummaryQuery) {
    if (!query.practiceId) {
      throw new BadRequestException('practiceId is required for billing summary');
    }
    return this.invoicesRepo.summary(query.practiceId, query.patientId, query.from, query.to);
  }
}
