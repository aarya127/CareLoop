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

  listInvoices(practiceId: string, filter: InvoiceFilter) {
    // Tenancy always from the session — override any client-supplied practiceId.
    return this.invoicesRepo.findAll({ ...filter, practiceId });
  }

  async getInvoice(practiceId: string, id: string) {
    const invoice = await this.invoicesRepo.findById(id);
    if (!invoice || invoice.practiceId !== practiceId) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async createInvoice(practiceId: string, dto: CreateInvoiceDto, actorUserId?: string) {
    const invalidReferences = await this.invoicesRepo.findInvalidReferences(
      practiceId,
      dto.patientId,
      dto.treatmentId,
    );
    if (invalidReferences.length > 0) {
      throw new BadRequestException(`Invalid invoice references: ${invalidReferences.join(', ')}`);
    }

    const lineItemTotal = dto.lineItems?.reduce(
      (sum, item) => sum + item.qty * item.unitPriceCents,
      0,
    );
    if (lineItemTotal != null && lineItemTotal !== dto.totalAmountCents) {
      throw new BadRequestException('totalAmountCents must equal the sum of line items');
    }

    const invoice = await this.invoicesRepo.create({
      practiceId,
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
      practiceId,
      eventType: 'invoice_created',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: invoice.id, practiceId, patientId: dto.patientId },
    });

    return invoice;
  }

  async updateInvoice(practiceId: string, id: string, dto: UpdateInvoiceDto, actorUserId?: string) {
    await this.getInvoice(practiceId, id);

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
      practiceId,
      eventType: 'invoice_updated',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: id, changes: dto },
    });

    return invoice;
  }

  async sendInvoice(practiceId: string, id: string, actorUserId?: string) {
    const existing = await this.getInvoice(practiceId, id);
    if (existing.status === 'void') {
      throw new BadRequestException('Cannot send a voided invoice');
    }

    const invoice = await this.invoicesRepo.update(id, {
      status: 'sent',
      issuedAt: new Date(),
      updatedBy: actorUserId,
    });

    await this.auditService.record({
      practiceId,
      eventType: 'invoice_sent',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: id },
    });

    return invoice;
  }

  async voidInvoice(practiceId: string, id: string, actorUserId?: string) {
    await this.getInvoice(practiceId, id);

    const invoice = await this.invoicesRepo.update(id, {
      status: 'void',
      updatedBy: actorUserId,
    });

    await this.auditService.record({
      practiceId,
      eventType: 'invoice_voided',
      outcome: 'success',
      actorUserId,
      metadata: { invoiceId: id },
    });

    return invoice;
  }

  async getBillingSummary(practiceId: string, query: BillingSummaryQuery) {
    return this.invoicesRepo.summary(practiceId, query.patientId, query.from, query.to);
  }
}
