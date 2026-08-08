import { describe, it, expect, vi } from 'vitest';
import { PatientsService } from './patients.service';
import type { PatientsRepository } from './patients.repository';
import type { AuditService } from '../audit/audit.service';

/**
 * Tenant-isolation guarantees for PatientsService: reads and mutations are
 * scoped to the caller's practiceId (from the session), so no authenticated
 * user can read or modify another practice's patient records by id.
 */
function makeService() {
  const patientFindMany = vi.fn(async () => []);
  const update = vi.fn(async () => ({ id: 'patient-1', practiceId: 'practice-A' }));
  const create = vi.fn(async () => ({ id: 'patient-new', practiceId: 'practice-A' }));
  const del = vi.fn(async () => ({ id: 'patient-1' }));
  // findFirst only returns a record when the query is scoped to the owning practice.
  const findFirst = vi.fn(async (args: any) =>
    args?.where?.practiceId === 'practice-A'
      ? { id: 'patient-1', practiceId: 'practice-A', insuranceRecords: [] }
      : null,
  );
  const historyFind = vi.fn(async () => ({ history: { conditions: ['asthma'] } }));
  const historyUpsert = vi.fn(async () => ({ history: { conditions: ['asthma'] } }));
  const repo = {
    prisma: {
      patient: { findFirst, findMany: patientFindMany, create, update, delete: del },
      patientMedicalHistory: { findUnique: historyFind, upsert: historyUpsert },
    },
  } as unknown as PatientsRepository;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  return {
    service: new PatientsService(repo, audit),
    update,
    create,
    del,
    findFirst,
    historyFind,
    historyUpsert,
    patientFindMany,
  };
}

describe('PatientsService tenant isolation', () => {
  it('findById returns the patient for the owning practice', async () => {
    const { service } = makeService();
    await expect(service.findById('practice-A', 'patient-1')).resolves.toMatchObject({
      id: 'patient-1',
    });
  });

  it('propagates patient-list database failures instead of returning an empty practice', async () => {
    const { service, patientFindMany } = makeService();
    patientFindMany.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.findAll('practice-A', { limit: 50, offset: 0 })).rejects.toThrow(
      'database unavailable',
    );
  });

  it('bounds patient-list database reads using validated pagination', async () => {
    const { service, patientFindMany } = makeService();

    await service.findAll('practice-A', { search: 'Ada', limit: 25, offset: 50 });

    expect(patientFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 25, skip: 50 }));
  });

  it('findById returns null for a different practice (no cross-tenant read)', async () => {
    const { service } = makeService();
    await expect(service.findById('practice-B', 'patient-1')).resolves.toBeNull();
  });

  it('update refuses and does not write for a different practice', async () => {
    const { service, update } = makeService();
    await expect(service.update('practice-B', 'patient-1', { firstName: 'X' })).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('update writes for the owning practice', async () => {
    const { service, update } = makeService();
    await expect(
      service.update('practice-A', 'patient-1', { firstName: 'X' }),
    ).resolves.toMatchObject({
      id: 'patient-1',
    });
    expect(update).toHaveBeenCalledOnce();
  });

  it('remove refuses and does not delete for a different practice', async () => {
    const { service, del } = makeService();
    await service.remove('practice-B', 'patient-1');
    expect(del).not.toHaveBeenCalled();
  });

  it('reads migration-managed medical history only for an owned patient', async () => {
    const { service, historyFind } = makeService();
    await expect(service.findMedicalHistory('practice-A', 'patient-1')).resolves.toEqual({
      conditions: ['asthma'],
    });
    expect(historyFind).toHaveBeenCalledWith({
      where: { patientId: 'patient-1' },
      select: { history: true },
    });
  });

  it('propagates medical-history write failures instead of reporting success', async () => {
    const { service, historyUpsert } = makeService();
    historyUpsert.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(
      service.upsertMedicalHistory('practice-A', 'patient-1', { conditions: ['asthma'] }),
    ).rejects.toThrow('database unavailable');
  });

  it('rejects impossible or future dates of birth', async () => {
    const { service, create } = makeService();
    await expect(
      service.create('practice-A', {
        firstName: 'Ada',
        lastName: 'Lovelace',
        dateOfBirth: '2025-02-31',
      }),
    ).rejects.toThrow('valid calendar date');
    await expect(
      service.create('practice-A', {
        firstName: 'Ada',
        lastName: 'Lovelace',
        dateOfBirth: '2999-01-01',
      }),
    ).rejects.toThrow('cannot be in the future');
    expect(create).not.toHaveBeenCalled();
  });
});
