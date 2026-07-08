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
  const update = vi.fn(async () => ({ id: 'patient-1', practiceId: 'practice-A' }));
  const del = vi.fn(async () => ({ id: 'patient-1' }));
  // findFirst only returns a record when the query is scoped to the owning practice.
  const findFirst = vi.fn(async (args: any) =>
    args?.where?.practiceId === 'practice-A'
      ? { id: 'patient-1', practiceId: 'practice-A', insuranceRecords: [] }
      : null,
  );
  const repo = {
    prisma: { patient: { findFirst, update, delete: del } },
  } as unknown as PatientsRepository;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  return { service: new PatientsService(repo, audit), update, del, findFirst };
}

describe('PatientsService tenant isolation', () => {
  it('findById returns the patient for the owning practice', async () => {
    const { service } = makeService();
    await expect(service.findById('practice-A', 'patient-1')).resolves.toMatchObject({ id: 'patient-1' });
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
    await expect(service.update('practice-A', 'patient-1', { firstName: 'X' })).resolves.toMatchObject({
      id: 'patient-1',
    });
    expect(update).toHaveBeenCalledOnce();
  });

  it('remove refuses and does not delete for a different practice', async () => {
    const { service, del } = makeService();
    await service.remove('practice-B', 'patient-1');
    expect(del).not.toHaveBeenCalled();
  });
});
