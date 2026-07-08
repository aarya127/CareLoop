import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import type { InvoicesRepository } from './invoices.repository';
import type { AuditService } from '../audit/audit.service';

/**
 * Tenant-isolation guarantees for BillingService: invoices may only be read,
 * updated, sent, or voided by the practice that owns them.
 */
function makeService(invoice: { id: string; practiceId: string; status?: string } | null) {
  const repo = {
    findById: vi.fn(async () => invoice),
    update: vi.fn(async () => invoice),
  } as unknown as InvoicesRepository;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  return { service: new BillingService(repo, audit), repo };
}

const INVOICE = { id: 'inv-1', practiceId: 'practice-A', status: 'draft' };

describe('BillingService tenant isolation', () => {
  it('getInvoice returns the invoice for the owning practice', async () => {
    const { service } = makeService(INVOICE);
    await expect(service.getInvoice('practice-A', 'inv-1')).resolves.toMatchObject({ id: 'inv-1' });
  });

  it('getInvoice 404s for a different practice', async () => {
    const { service } = makeService(INVOICE);
    await expect(service.getInvoice('practice-B', 'inv-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('voidInvoice refuses a cross-tenant invoice before writing', async () => {
    const { service, repo } = makeService(INVOICE);
    await expect(service.voidInvoice('practice-B', 'inv-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updateInvoice refuses a cross-tenant invoice before writing', async () => {
    const { service, repo } = makeService(INVOICE);
    await expect(service.updateInvoice('practice-B', 'inv-1', { notes: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
