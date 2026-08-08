import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  patientFind: vi.fn(),
  appointmentFind: vi.fn(),
  providerFind: vi.fn(),
  encounterCreate: vi.fn(),
  treatmentPlanFind: vi.fn(),
  treatmentPlanUpdate: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: {},
  prisma: {
    patient: { findUnique: mocks.patientFind },
    appointment: { findFirst: mocks.appointmentFind },
    provider: { findFirst: mocks.providerFind },
    encounter: { create: mocks.encounterCreate },
    treatmentPlan: {
      findUnique: mocks.treatmentPlanFind,
      update: mocks.treatmentPlanUpdate,
    },
  },
}));

import { EmrService } from './emr.service';

const actor = { id: 'clinician-A', practiceId: 'practice-A' };

function service() {
  return new EmrService({ record: vi.fn(async () => {}) } as any, {} as any, {} as any);
}

describe('EmrService clinical reference isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patientFind.mockResolvedValue({ id: 'patient-A', practiceId: 'practice-A' });
    mocks.appointmentFind.mockResolvedValue({ id: 'appointment-A', patientId: 'patient-A' });
    mocks.providerFind.mockResolvedValue({ id: 'provider-A' });
  });

  it('rejects an encounter appointment belonging to another patient or practice', async () => {
    mocks.appointmentFind.mockResolvedValueOnce(null);

    await expect(
      service().createEncounter(actor, 'patient-A', {
        appointmentId: 'appointment-B',
        providerId: 'provider-A',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.encounterCreate).not.toHaveBeenCalled();
  });

  it('rejects a foreign provider on treatment-plan update', async () => {
    mocks.treatmentPlanFind.mockResolvedValueOnce({
      id: 'plan-A',
      practiceId: 'practice-A',
      patientId: 'patient-A',
    });
    mocks.providerFind.mockResolvedValueOnce(null);

    await expect(
      service().updateTreatmentPlan(actor, 'plan-A', { providerId: 'provider-B' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.treatmentPlanUpdate).not.toHaveBeenCalled();
  });
});
