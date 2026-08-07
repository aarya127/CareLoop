import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import type { AppointmentsRepository } from './appointments.repository';
import type { AvailabilityService } from './availability.service';
import type { AuditService } from '../audit/audit.service';
import type { IdempotencyService } from '../../common/services/idempotency.service';

vi.mock('../../config/redis', () => ({
  getRedisClient: () => ({ publish: vi.fn(async () => 1) }),
}));

/**
 * Tenant-isolation guarantees for AppointmentsService: an appointment may only
 * be read or mutated by a caller whose session practiceId matches the record's
 * practiceId. practiceId is always supplied by the controller from req.user,
 * never from client input.
 */
function makeService(
  appt: { id: string; practiceId: string; status?: string } | null,
  invalidReferences: string[] = [],
) {
  const created = {
    id: 'appt-new',
    practiceId: 'practice-A',
    providerId: 'provider-A',
    patientId: 'patient-A',
    title: 'Appointment',
    start: new Date('2026-03-10T09:00:00Z'),
    end: new Date('2026-03-10T09:30:00Z'),
    status: 'confirmed',
    source: 'manual',
  };
  const repo = {
    findById: vi.fn(async () => appt),
    update: vi.fn(async () => appt),
    findConflicting: vi.fn(async () => []),
    findInvalidReferences: vi.fn(async () => invalidReferences),
    create: vi.fn(async () => created),
  } as unknown as AppointmentsRepository;
  const availability = { invalidateCache: vi.fn(async () => {}) } as unknown as AvailabilityService;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  const idempotency = {
    claim: vi.fn(async () => null),
    complete: vi.fn(async () => {}),
    release: vi.fn(async () => {}),
  } as unknown as IdempotencyService;
  return {
    service: new AppointmentsService(repo, availability, audit, idempotency),
    repo,
    idempotency,
  };
}

const APPT = { id: 'appt-1', practiceId: 'practice-A', status: 'confirmed' };

describe('AppointmentsService tenant isolation', () => {
  it('findById returns the appointment for the owning practice', async () => {
    const { service } = makeService(APPT);
    await expect(service.findById('practice-A', 'appt-1')).resolves.toMatchObject({ id: 'appt-1' });
  });

  it('findById 404s for a different practice (no cross-tenant read)', async () => {
    const { service } = makeService(APPT);
    await expect(service.findById('practice-B', 'appt-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findById 404s for a missing appointment', async () => {
    const { service } = makeService(null);
    await expect(service.findById('practice-A', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reschedule refuses a cross-tenant appointment before mutating', async () => {
    const { service, repo } = makeService(APPT);
    await expect(
      service.reschedule('practice-B', 'appt-1', {
        start: '2026-03-10T09:00:00Z',
        end: '2026-03-10T09:30:00Z',
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('cancel refuses a cross-tenant appointment before mutating', async () => {
    const { service, repo } = makeService(APPT);
    await expect(service.cancel('practice-B', 'appt-1', {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects foreign-key references outside the caller practice before creating', async () => {
    const { service, repo } = makeService(null, ['providerId', 'patientId']);

    await expect(
      service.create('practice-A', {
        userId: 'user-A',
        providerId: 'provider-B',
        patientId: 'patient-B',
        start: '2026-03-10T09:00:00Z',
        end: '2026-03-10T09:30:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.findConflicting).not.toHaveBeenCalled();
  });

  it('scopes conflict checks and idempotency keys to the caller practice', async () => {
    const { service, repo, idempotency } = makeService(null);

    await service.create(
      'practice-A',
      {
        userId: 'user-A',
        providerId: 'provider-A',
        patientId: 'patient-A',
        start: '2026-03-10T09:00:00Z',
        end: '2026-03-10T09:30:00Z',
      },
      'same-client-key',
      'admin-A',
    );

    expect(repo.findConflicting).toHaveBeenCalledWith(
      'practice-A',
      'provider-A',
      new Date('2026-03-10T09:00:00Z'),
      new Date('2026-03-10T09:30:00Z'),
    );
    expect(idempotency.claim).toHaveBeenCalledWith('appointments:practice-A:same-client-key');
  });
});
