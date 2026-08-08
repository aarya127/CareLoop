import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  patientFind: vi.fn(),
  insuranceCreate: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  prisma: {
    patient: { findFirst: mocks.patientFind },
    patientInsurance: { create: mocks.insuranceCreate },
  },
}));

import { decryptSensitiveField } from '../../common/security/field-encryption';
import { InsuranceService } from './insurance.service';

describe('InsuranceService identifier encryption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = 'test-only-insurance-encryption-key';
    mocks.patientFind.mockResolvedValue({ id: 'patient-A' });
    mocks.insuranceCreate.mockImplementation(async ({ data }) => ({ id: 'insurance-A', ...data }));
  });

  it('encrypts identifiers while retaining a lookup hash of the raw member ID', async () => {
    const record = await new InsuranceService().create('practice-A', {
      patientId: 'patient-A',
      payerName: 'Payer',
      memberIdEnc: 'MEMBER-123',
      groupNumberEnc: 'GROUP-456',
    });

    const stored = mocks.insuranceCreate.mock.calls[0][0].data;
    expect(stored.memberIdEnc).not.toContain('MEMBER-123');
    expect(stored.groupNumberEnc).not.toContain('GROUP-456');
    expect(decryptSensitiveField(stored.memberIdEnc)).toBe('MEMBER-123');
    expect(decryptSensitiveField(stored.groupNumberEnc)).toBe('GROUP-456');
    expect(stored.memberIdHash).toBe(
      crypto.createHash('sha256').update('MEMBER-123').digest('hex'),
    );
    expect(record).not.toHaveProperty('memberIdEnc');
    expect(record).not.toHaveProperty('groupNumberEnc');
    expect(record.memberIdMasked).toBe('••••-123');
  });
});
