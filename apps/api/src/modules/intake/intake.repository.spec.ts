import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRawUnsafe: vi.fn(),
    patient: { create: vi.fn() },
    patientInsurance: { create: vi.fn() },
    intakeSubmission: { create: vi.fn() },
    intakeDraft: { update: vi.fn() },
  };
  return {
    tx,
    transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  };
});

vi.mock('../../config/database', () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { IntakeRepository } from './intake.repository';

const data = {
  demographics: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    dateOfBirth: '1815-12-10',
    phone: '+14165550100',
  },
  insurance: { payerName: 'Payer', memberId: 'member-123' },
};

describe('IntakeRepository atomic submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = 'test-only-intake-encryption-key';
    mocks.tx.$queryRawUnsafe.mockResolvedValue([
      { id: 'draft-A', practiceId: 'practice-A', status: 'draft' },
    ]);
    mocks.tx.patient.create.mockResolvedValue({ id: 'patient-A' });
    mocks.tx.patientInsurance.create.mockResolvedValue({ id: 'insurance-A' });
    mocks.tx.intakeSubmission.create.mockResolvedValue({ id: 'submission-A' });
    mocks.tx.intakeDraft.update.mockResolvedValue({ id: 'draft-A', status: 'submitted' });
  });

  it('creates all records and finalizes the locked draft in one transaction', async () => {
    const result = await new IntakeRepository().submitDraft(
      'draft-A',
      'practice-A',
      data,
      new Date('1815-12-10T00:00:00.000Z'),
      'intake:draft-A:key-A',
    );

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      'draft-A',
    );
    expect(mocks.tx.patient.create).toHaveBeenCalledOnce();
    expect(mocks.tx.patientInsurance.create).toHaveBeenCalledOnce();
    expect(mocks.tx.intakeSubmission.create).toHaveBeenCalledOnce();
    expect(mocks.tx.intakeDraft.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'draft-A' },
        data: expect.objectContaining({ status: 'submitted', patientId: 'patient-A' }),
      }),
    );
    expect(result.patient.id).toBe('patient-A');
  });

  it('rejects a second submission after acquiring the draft lock', async () => {
    mocks.tx.$queryRawUnsafe.mockResolvedValueOnce([
      { id: 'draft-A', practiceId: 'practice-A', status: 'submitted' },
    ]);

    await expect(
      new IntakeRepository().submitDraft(
        'draft-A',
        'practice-A',
        data,
        new Date('1815-12-10T00:00:00.000Z'),
        'intake:draft-A:key-B',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.tx.patient.create).not.toHaveBeenCalled();
  });
});
