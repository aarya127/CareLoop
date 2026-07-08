import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { PaymentsRepository } from './payments.repository';
import type { AuditService } from '../audit/audit.service';
import type { IdempotencyService } from '../../common/services/idempotency.service';

/**
 * Tenant-isolation guarantees for PaymentsService: payments may only be read or
 * mutated by the practice that owns them. practiceId comes from the session.
 */
function makeService(payment: { id: string; practiceId: string } | null) {
  const repo = {
    findById: vi.fn(async () => payment),
    update: vi.fn(async () => payment),
  } as unknown as PaymentsRepository;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  const idempotency = {} as unknown as IdempotencyService;
  return { service: new PaymentsService(repo, audit, idempotency), repo };
}

const PAYMENT = { id: 'pay-1', practiceId: 'practice-A' };

describe('PaymentsService tenant isolation', () => {
  it('getPayment returns the payment for the owning practice', async () => {
    const { service } = makeService(PAYMENT);
    await expect(service.getPayment('practice-A', 'pay-1')).resolves.toMatchObject({ id: 'pay-1' });
  });

  it('getPayment 404s for a different practice', async () => {
    const { service } = makeService(PAYMENT);
    await expect(service.getPayment('practice-B', 'pay-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updatePayment refuses a cross-tenant payment before writing', async () => {
    const { service, repo } = makeService(PAYMENT);
    await expect(service.updatePayment('practice-B', 'pay-1', { status: 'refunded' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
