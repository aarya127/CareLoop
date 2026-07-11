import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Shared mock of the global Prisma client. vi.hoisted lets the mock factory and
// the tests reference the same object.
const { prismaMock, state } = vi.hoisted(() => {
  const state: { patient: any; claim: any } = { patient: { id: 'p1' }, claim: null };
  const tx = {
    claim: {
      create: vi.fn(async ({ data }: any) => ({ id: 'c1', lines: [], events: [], ...data })),
      update: vi.fn(async ({ data }: any) => ({ id: 'c1', lines: [], events: [], ...data })),
    },
    claimStatusEvent: { create: vi.fn(async () => ({})) },
  };
  const prismaMock = {
    patient: { findFirst: vi.fn(async () => state.patient) },
    claim: {
      findFirst: vi.fn(async () => state.claim),
      findMany: vi.fn(async () => []),
    },
    $transaction: vi.fn(async (cb: any) => cb(tx)),
  };
  return { prismaMock, state, tx };
});

vi.mock('@careloop/db', () => ({ prisma: prismaMock }));

import { ClaimsService } from './claims.service';

const svc = new ClaimsService();

beforeEach(() => {
  state.patient = { id: 'p1' };
  state.claim = null;
  vi.clearAllMocks();
});

describe('ClaimsService.create', () => {
  it('sums line charges and starts in draft', async () => {
    const claim = await svc.create('practice-A', 'user-1', {
      patientId: 'p1',
      lines: [
        { procedureCode: 'D1110', chargedCents: 12000 },
        { procedureCode: 'D0120', chargedCents: 5000 },
      ],
    });
    expect(claim.totalChargedCents).toBe(17000);
    expect(claim.status).toBe('draft');
  });

  it('404s when the patient is not in the caller practice', async () => {
    state.patient = null;
    await expect(
      svc.create('practice-A', 'user-1', {
        patientId: 'pX',
        lines: [{ procedureCode: 'D', chargedCents: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a claim with no line items', async () => {
    await expect(
      svc.create('practice-A', 'user-1', { patientId: 'p1', lines: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ClaimsService state machine', () => {
  it('get 404s for a missing / cross-tenant claim', async () => {
    state.claim = null;
    await expect(svc.get('practice-A', 'c1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('submit only works from draft', async () => {
    state.claim = { id: 'c1', status: 'submitted', lines: [], events: [] };
    await expect(svc.submit('practice-A', 'c1', 'u1')).rejects.toBeInstanceOf(BadRequestException);

    state.claim = { id: 'c1', status: 'draft', lines: [], events: [] };
    await expect(svc.submit('practice-A', 'c1', 'u1')).resolves.toMatchObject({
      status: 'submitted',
    });
  });

  it('cannot adjudicate a draft claim (must submit first)', async () => {
    state.claim = { id: 'c1', status: 'draft', lines: [], events: [] };
    await expect(
      svc.updateStatus('practice-A', 'c1', 'u1', { status: 'accepted' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cannot change a terminal (paid) claim', async () => {
    state.claim = { id: 'c1', status: 'paid', lines: [], events: [] };
    await expect(
      svc.updateStatus('practice-A', 'c1', 'u1', { status: 'rejected' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records an adjudication outcome on a submitted claim', async () => {
    state.claim = { id: 'c1', status: 'submitted', lines: [], events: [] };
    await expect(
      svc.updateStatus('practice-A', 'c1', 'u1', {
        status: 'accepted',
        approvedAmountCents: 15300,
      }),
    ).resolves.toMatchObject({ status: 'accepted' });
  });
});
