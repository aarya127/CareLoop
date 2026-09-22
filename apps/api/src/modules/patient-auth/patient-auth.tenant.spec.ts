import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  patientFindFirst: vi.fn(),
  patientFindUnique: vi.fn(),
  patientSessionFindUnique: vi.fn(),
  patientSessionUpdateMany: vi.fn(),
  patientSessionUpdate: vi.fn(),
  invitationUpdateMany: vi.fn(),
  invitationCreate: vi.fn(),
  practiceFindUnique: vi.fn(),
  credentialFindUnique: vi.fn(),
  getRedisClient: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  prisma: {
    patient: { findFirst: mocks.patientFindFirst, findUnique: mocks.patientFindUnique },
    patientCredential: { findUnique: mocks.credentialFindUnique },
    patientInvitation: { updateMany: mocks.invitationUpdateMany, create: mocks.invitationCreate },
    patientSession: {
      findUnique: mocks.patientSessionFindUnique,
      updateMany: mocks.patientSessionUpdateMany,
      update: mocks.patientSessionUpdate,
    },
    practice: { findUnique: mocks.practiceFindUnique },
  },
}));

vi.mock('../../config/redis', () => ({
  getRedisClient: mocks.getRedisClient,
}));

import { PatientAuthService } from './patient-auth.service';
import { PatientAuthGuard } from './patient-auth.guard';
import { PatientSessionService } from './patient-session.service';

describe('patient portal tenant/record isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRedisClient.mockImplementation(() => {
      throw new Error('redis unavailable in test');
    });
  });

  it('a staff invite for a patient outside their own practice is rejected before any invite row is created', async () => {
    // patient-99 genuinely exists, but in a different practice — the lookup is
    // scoped by (id, practiceId), so a cross-tenant id resolves to nothing.
    mocks.patientFindFirst.mockResolvedValue(null);
    const service = new PatientAuthService({} as any, { send: vi.fn() } as any);

    await expect(
      service.invite('practice-A', 'staff-A', { patientId: 'patient-99', email: 'p@example.com' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.patientFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'patient-99', practiceId: 'practice-A' } }),
    );
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('PatientAuthGuard derives req.patient entirely from the validated session — never from client input', async () => {
    mocks.patientSessionFindUnique.mockResolvedValue({
      id: 'sess-1',
      patientId: 'patient-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      idleExpiresAt: new Date(Date.now() + 60_000),
      patient: {
        portalCredential: { status: 'active', practiceId: 'practice-A' },
      },
    });
    mocks.patientSessionUpdate.mockResolvedValue({});

    const guard = new PatientAuthGuard(new PatientSessionService());
    const req: any = {
      cookies: { cl_patient_session: 'raw-token' },
      headers: {},
    };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => req }),
    };

    const allowed = await guard.canActivate(ctx);

    expect(allowed).toBe(true);
    // Even though nothing in the request body claims a patientId/practiceId,
    // req.patient is populated purely from the session row's own patient link.
    expect(req.patient).toEqual({
      id: 'patient-1',
      patientId: 'patient-1',
      practiceId: 'practice-A',
      sessionId: 'sess-1',
    });
  });

  it('a session for a patient whose portal account was disabled is rejected, not silently scoped down', async () => {
    mocks.patientSessionFindUnique.mockResolvedValue({
      id: 'sess-1',
      patientId: 'patient-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      idleExpiresAt: new Date(Date.now() + 60_000),
      patient: {
        portalCredential: { status: 'disabled', practiceId: 'practice-A' },
      },
    });

    const guard = new PatientAuthGuard(new PatientSessionService());
    const req: any = { cookies: { cl_patient_session: 'raw-token' }, headers: {} };
    const ctx: any = { switchToHttp: () => ({ getRequest: () => req }) };

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('a missing patient session cookie is rejected outright (no fallback to a staff cookie)', async () => {
    const guard = new PatientAuthGuard(new PatientSessionService());
    const req: any = { cookies: { cl_session: 'staff-token-only' }, headers: {} };
    const ctx: any = { switchToHttp: () => ({ getRequest: () => req }) };

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
