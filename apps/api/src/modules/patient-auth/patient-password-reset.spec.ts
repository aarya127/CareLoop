import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoneException, NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  credentialFindUnique: vi.fn(),
  credentialUpdate: vi.fn(),
  patientFindUnique: vi.fn(),
  tokenFindUnique: vi.fn(),
  tokenCreate: vi.fn(),
  tokenUpdateMany: vi.fn(),
  hashPassword: vi.fn(),
  hashToken: vi.fn((raw: string) => `hashed:${raw}`),
  randomToken: vi.fn(() => 'raw-reset-token'),
  revokeAllPatientSessions: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  prisma: {
    patient: { findUnique: mocks.patientFindUnique },
    patientCredential: { findUnique: mocks.credentialFindUnique, update: mocks.credentialUpdate },
    patientPasswordResetToken: {
      findUnique: mocks.tokenFindUnique,
      create: mocks.tokenCreate,
      updateMany: mocks.tokenUpdateMany,
    },
  },
}));

vi.mock('../auth/auth.utils', () => ({
  hashPassword: mocks.hashPassword,
  hashToken: mocks.hashToken,
  randomToken: mocks.randomToken,
  passwordNeedsRehash: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { PatientAuthService } from './patient-auth.service';

function service() {
  const sessions = {
    revokeAllPatientSessions: mocks.revokeAllPatientSessions,
    createSession: mocks.createSession.mockResolvedValue({
      rawToken: 'new-patient-session-token',
      sessionId: 'sess-new',
    }),
  };
  const email = { send: vi.fn().mockResolvedValue('message-id') };
  return { svc: new PatientAuthService(sessions as any, email as any), sessions, email };
}

describe('PatientAuthService.forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tokenCreate.mockResolvedValue({});
  });

  it('creates a reset token and sends an email when the portal account exists', async () => {
    mocks.credentialFindUnique.mockResolvedValue({
      id: 'cred-1',
      patientId: 'patient-1',
      status: 'active',
    });
    const { svc, email } = service();

    await svc.forgotPassword({ email: 'jo@example.com' }, {});

    expect(mocks.tokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ patientId: 'patient-1' }) }),
    );
    expect(email.send).toHaveBeenCalled();
  });

  it('resolves silently (no enumeration) when no portal account matches the email', async () => {
    mocks.credentialFindUnique.mockResolvedValue(null);
    const { svc, email } = service();

    await expect(svc.forgotPassword({ email: 'nobody@example.com' }, {})).resolves.toBeUndefined();
    expect(mocks.tokenCreate).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('resolves silently for a disabled portal account too', async () => {
    mocks.credentialFindUnique.mockResolvedValue({
      id: 'cred-1',
      patientId: 'patient-1',
      status: 'disabled',
    });
    const { svc } = service();

    await expect(svc.forgotPassword({ email: 'jo@example.com' }, {})).resolves.toBeUndefined();
    expect(mocks.tokenCreate).not.toHaveBeenCalled();
  });
});

describe('PatientAuthService.resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashPassword.mockResolvedValue('new-hash');
    mocks.credentialUpdate.mockResolvedValue({});
    // Only reached on a successful reset (toSafePrincipal at the end).
    mocks.patientFindUnique.mockResolvedValue({
      id: 'patient-1',
      practiceId: 'practice-A',
      firstName: 'Jo',
      lastName: 'Doe',
      portalCredential: { email: 'jo@example.com' },
    });
  });

  function validToken(overrides: Record<string, any> = {}) {
    return {
      id: 'token-1',
      patientId: 'patient-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      patient: { portalCredential: { email: 'jo@example.com' } },
      ...overrides,
    };
  }

  it('rejects an unknown token', async () => {
    mocks.tokenFindUnique.mockResolvedValue(null);
    const { svc } = service();

    await expect(
      svc.resetPassword('bad-token', { password: 'longenough1' }, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an already-used token', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken({ usedAt: new Date() }));
    const { svc } = service();

    await expect(
      svc.resetPassword('used-token', { password: 'longenough1' }, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an expired token', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken({ expiresAt: new Date(Date.now() - 1000) }));
    const { svc } = service();

    await expect(
      svc.resetPassword('expired-token', { password: 'longenough1' }, {}),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('rejects a token whose patient no longer has a portal credential', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken({ patient: { portalCredential: null } }));
    const { svc } = service();

    await expect(
      svc.resetPassword('orphaned-token', { password: 'longenough1' }, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a double-consume race where the token was used concurrently', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken());
    mocks.tokenUpdateMany.mockResolvedValue({ count: 0 });
    const { svc } = service();

    await expect(
      svc.resetPassword('raw-token', { password: 'longenough1' }, {}),
    ).rejects.toBeInstanceOf(GoneException);
    expect(mocks.credentialUpdate).not.toHaveBeenCalled();
  });

  it('on success: updates the password scoped to that patientId, revokes every session, and starts a fresh one', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken());
    mocks.tokenUpdateMany.mockResolvedValue({ count: 1 });
    const { svc, sessions } = service();

    const result = await svc.resetPassword('raw-token', { password: 'longenough1' }, {});

    expect(mocks.credentialUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: 'patient-1' },
        data: expect.objectContaining({ passwordHash: 'new-hash' }),
      }),
    );
    expect(sessions.revokeAllPatientSessions).toHaveBeenCalledWith('patient-1', 'password_reset');
    expect(sessions.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'patient-1' }),
    );
    expect(result.sessionToken).toBe('new-patient-session-token');
  });
});
