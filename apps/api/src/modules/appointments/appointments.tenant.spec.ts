import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import type { AppointmentsRepository } from './appointments.repository';
import type { AvailabilityService } from './availability.service';
import type { AuditService } from '../audit/audit.service';
import type { IdempotencyService } from '../../common/services/idempotency.service';

/**
 * Tenant-isolation guarantees for AppointmentsService: an appointment may only
 * be read or mutated by a caller whose session practiceId matches the record's
 * practiceId. practiceId is always supplied by the controller from req.user,
 * never from client input.
 */
function makeService(appt: { id: string; practiceId: string; status?: string } | null) {
  const repo = {
    findById: vi.fn(async () => appt),
    update: vi.fn(async () => appt),
    findConflicting: vi.fn(async () => []),
  } as unknown as AppointmentsRepository;
  const availability = { invalidateCache: vi.fn(async () => {}) } as unknown as AvailabilityService;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  const idempotency = {} as unknown as IdempotencyService;
  return { service: new AppointmentsService(repo, availability, audit, idempotency), repo };
}

const APPT = { id: 'appt-1', practiceId: 'practice-A', status: 'confirmed' };

describe('AppointmentsService tenant isolation', () => {
  it('findById returns the appointment for the owning practice', async () => {
    const { service } = makeService(APPT);
    await expect(service.findById('practice-A', 'appt-1')).resolves.toMatchObject({ id: 'appt-1' });
  });

  it('findById 404s for a different practice (no cross-tenant read)', async () => {
    const { service } = makeService(APPT);
    await expect(service.findById('practice-B', 'appt-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findById 404s for a missing appointment', async () => {
    const { service } = makeService(null);
    await expect(service.findById('practice-A', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reschedule refuses a cross-tenant appointment before mutating', async () => {
    const { service, repo } = makeService(APPT);
    await expect(
      service.reschedule('practice-B', 'appt-1', { start: '2026-03-10T09:00:00Z', end: '2026-03-10T09:30:00Z' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('cancel refuses a cross-tenant appointment before mutating', async () => {
    const { service, repo } = makeService(APPT);
    await expect(service.cancel('practice-B', 'appt-1', {} as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
