import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuditService } from '../audit/audit.service';
import type { TreatmentsRepository } from './treatments.repository';
import { TreatmentsService } from './treatments.service';

function makeService(
  record: { id: string; practiceId: string; patientId: string } | null,
  invalidReferences: string[] = [],
) {
  const repository = {
    findById: vi.fn(async () => record),
    findInvalidReferences: vi.fn(async () => invalidReferences),
    create: vi.fn(async (data) => ({ id: 'treatment-new', ...data })),
    update: vi.fn(async (_id, data) => ({ ...record, ...data })),
  } as unknown as TreatmentsRepository;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  return { service: new TreatmentsService(repository, audit), repository };
}

describe('TreatmentsService tenant reference integrity', () => {
  it('rejects cross-tenant references before creating a clinical record', async () => {
    const { service, repository } = makeService(null, ['patientId', 'providerId']);

    await expect(
      service.create('practice-A', {
        patientId: 'patient-B',
        providerId: 'provider-B',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('validates appointment/provider updates against the existing patient and practice', async () => {
    const record = { id: 'treatment-1', practiceId: 'practice-A', patientId: 'patient-A' };
    const { service, repository } = makeService(record);

    await service.update('practice-A', 'treatment-1', {
      appointmentId: 'appointment-A',
      providerId: 'provider-A',
    });

    expect(repository.findInvalidReferences).toHaveBeenCalledWith('practice-A', 'patient-A', {
      appointmentId: 'appointment-A',
      providerId: 'provider-A',
    });
  });

  it('does not mutate a treatment owned by another practice', async () => {
    const { service, repository } = makeService({
      id: 'treatment-B',
      practiceId: 'practice-B',
      patientId: 'patient-B',
    });

    await expect(
      service.update('practice-A', 'treatment-B', { status: 'completed' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
