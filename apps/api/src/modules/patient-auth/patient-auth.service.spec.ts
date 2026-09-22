import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  patientFindFirst: vi.fn(),
  patientFindUnique: vi.fn(),
  credentialFindUnique: vi.fn(),
  credentialUpdate: vi.fn(),
  credentialCreate: vi.fn(),
  invitationFindUnique: vi.fn(),
  invitationUpdateMany: vi.fn(),
  invitationCreate: vi.fn(),
  invitationUpdate: vi.fn(),
  practiceFindUnique: vi.fn(),
  transaction: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  passwordNeedsRehash: vi.fn(),
  hashToken: vi.fn((raw: string) => `hashed:${raw}`),
  randomToken: vi.fn(() => 'raw-token'),
}));

vi.mock('@careloop/db', () => ({
  prisma: {
    patient: { findFirst: mocks.patientFindFirst, findUnique: mocks.patientFindUnique },
    patientCredential: {
      findUnique: mocks.credentialFindUnique,
      update: mocks.credentialUpdate,
      create: mocks.credentialCreate,
    },
    patientInvitation: {
      findUnique: mocks.invitationFindUnique,
      updateMany: mocks.invitationUpdateMany,
      create: mocks.invitationCreate,
      update: mocks.invitationUpdate,
    },
    practice: { findUnique: mocks.practiceFindUnique },
    $transaction: mocks.transaction,
  },
}));

vi.mock('../auth/auth.utils', () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
  passwordNeedsRehash: mocks.passwordNeedsRehash,
  hashToken: mocks.hashToken,
  randomToken: mocks.randomToken,
}));

import { PatientAuthService } from './patient-auth.service';
import { PATIENT_AUTH_LIMITS } from './patient-auth.constants';

function service(sessionOverrides: Record<string, any> = {}) {
  const sessions = {
    createSession: vi.fn().mockResolvedValue({ rawToken: 'session-token', sessionId: 'sess-1' }),
    ...sessionOverrides,
  };
  const email = { send: vi.fn().mockResolvedValue('message-id') };
  return { svc: new PatientAuthService(sessions as any, email as any), sessions, email };
}

describe('PatientAuthService.invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.practiceFindUnique.mockResolvedValue({ name: 'Bright Smiles' });
    mocks.invitationUpdateMany.mockResolvedValue({ count: 0 });
    mocks.invitationCreate.mockResolvedValue({
      id: 'invite-1',
      email: 'patient@example.com',
      status: 'pending',
      expiresAt: new Date(Date.now() + 1000),
    });
  });

  it('rejects a patientId that does not belong to the caller practice (forged patientId)', async () => {
    mocks.patientFindFirst.mockResolvedValue(null);
    const { svc } = service();

    await expect(
      svc.invite('practice-A', 'staff-A', {
        patientId: 'patient-in-practice-B',
        email: 'p@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.patientFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'patient-in-practice-B', practiceId: 'practice-A' } }),
    );
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects when the email is already used by a different patient portal account', async () => {
    mocks.patientFindFirst.mockResolvedValue({ id: 'patient-1', firstName: 'Jo', lastName: 'Doe' });
    mocks.credentialFindUnique.mockResolvedValue({ patientId: 'some-other-patient' });
    const { svc } = service();

    await expect(
      svc.invite('practice-A', 'staff-A', { patientId: 'patient-1', email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('supersedes any prior pending invite for the same patient before creating a new one', async () => {
    mocks.patientFindFirst.mockResolvedValue({ id: 'patient-1', firstName: 'Jo', lastName: 'Doe' });
    mocks.credentialFindUnique.mockResolvedValue(null);
    const { svc } = service();

    await svc.invite('practice-A', 'staff-A', { patientId: 'patient-1', email: 'p@example.com' });

    expect(mocks.invitationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { practiceId: 'practice-A', patientId: 'patient-1', status: 'pending' },
        data: { status: 'revoked' },
      }),
    );
    expect(mocks.invitationCreate).toHaveBeenCalled();
  });
});

describe('PatientAuthService.accept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashPassword.mockResolvedValue('hashed-pw');
    mocks.patientFindUnique.mockResolvedValue({
      id: 'patient-1',
      practiceId: 'practice-A',
      firstName: 'Jo',
      lastName: 'Doe',
      portalCredential: { email: 'p@example.com' },
    });
  });

  function validInvite(overrides: Record<string, any> = {}) {
    return {
      id: 'invite-1',
      patientId: 'patient-1',
      practiceId: 'practice-A',
      email: 'p@example.com',
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      practice: { name: 'Bright Smiles' },
      patient: { firstName: 'Jo', lastName: 'Doe' },
      ...overrides,
    };
  }

  it('rejects an expired invite token and marks it expired', async () => {
    mocks.invitationFindUnique.mockResolvedValue(
      validInvite({ expiresAt: new Date(Date.now() - 1000) }),
    );
    mocks.invitationUpdate.mockResolvedValue({});
    const { svc } = service();

    await expect(svc.accept('raw-token', { password: 'longenough1' }, {})).rejects.toBeInstanceOf(
      GoneException,
    );
    expect(mocks.invitationUpdate).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { status: 'expired' },
    });
  });

  it('rejects an already-accepted (reused) invite token', async () => {
    mocks.invitationFindUnique.mockResolvedValue(validInvite({ status: 'accepted' }));
    const { svc } = service();

    await expect(svc.accept('raw-token', { password: 'longenough1' }, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a revoked invite token', async () => {
    mocks.invitationFindUnique.mockResolvedValue(validInvite({ status: 'revoked' }));
    const { svc } = service();

    await expect(svc.accept('raw-token', { password: 'longenough1' }, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a double-accept race where the invite was consumed concurrently', async () => {
    mocks.invitationFindUnique.mockResolvedValue(validInvite());
    mocks.credentialFindUnique.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        patientCredential: { create: mocks.credentialCreate },
        patientInvitation: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      }),
    );
    const { svc } = service();

    await expect(svc.accept('raw-token', { password: 'longenough1' }, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates the credential and starts a session on a clean accept', async () => {
    mocks.invitationFindUnique.mockResolvedValue(validInvite());
    mocks.credentialFindUnique.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        patientCredential: { create: mocks.credentialCreate },
        patientInvitation: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }),
    );
    const { svc, sessions } = service();

    const result = await svc.accept('raw-token', { password: 'longenough1' }, { ip: '1.2.3.4' });

    expect(mocks.credentialCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ patientId: 'patient-1', practiceId: 'practice-A' }),
      }),
    );
    expect(sessions.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'patient-1' }),
    );
    expect(result.sessionToken).toBe('session-token');
  });
});

describe('PatientAuthService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.passwordNeedsRehash.mockReturnValue(false);
  });

  it('gives a generic invalid-credentials error for an unknown email (no enumeration)', async () => {
    mocks.credentialFindUnique.mockResolvedValue(null);
    const { svc } = service();

    await expect(
      svc.login({ email: 'nobody@example.com', password: 'whatever1' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('gives the same generic invalid-credentials error for a wrong password', async () => {
    mocks.credentialFindUnique.mockResolvedValue({
      id: 'cred-1',
      patientId: 'patient-1',
      passwordHash: 'stored-hash',
      status: 'active',
      lockedUntil: null,
      failedLoginCount: 0,
    });
    mocks.verifyPassword.mockResolvedValue(false);
    mocks.credentialUpdate.mockResolvedValue({ failedLoginCount: 1 });
    const { svc } = service();

    await expect(
      svc.login({ email: 'p@example.com', password: 'wrongpass' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('locks the account after the configured number of failed attempts', async () => {
    mocks.credentialFindUnique.mockResolvedValue({
      id: 'cred-1',
      patientId: 'patient-1',
      passwordHash: 'stored-hash',
      status: 'active',
      lockedUntil: null,
      failedLoginCount: 0,
    });
    mocks.verifyPassword.mockResolvedValue(false);
    mocks.credentialUpdate.mockResolvedValueOnce({
      failedLoginCount: PATIENT_AUTH_LIMITS.LOGIN_ACCOUNT_MAX_ATTEMPTS,
    });
    const { svc } = service();

    await expect(
      svc.login({ email: 'p@example.com', password: 'wrongpass' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mocks.credentialUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
      }),
    );
  });

  it('rejects login while locked, even with the correct password', async () => {
    mocks.credentialFindUnique.mockResolvedValue({
      id: 'cred-1',
      patientId: 'patient-1',
      passwordHash: 'stored-hash',
      status: 'active',
      lockedUntil: new Date(Date.now() + 60_000),
      failedLoginCount: 5,
    });
    const { svc } = service();

    await expect(
      svc.login({ email: 'p@example.com', password: 'correct1' }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('starts a session on a correct login', async () => {
    mocks.credentialFindUnique.mockResolvedValue({
      id: 'cred-1',
      patientId: 'patient-1',
      passwordHash: 'stored-hash',
      status: 'active',
      lockedUntil: null,
      failedLoginCount: 0,
    });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.credentialUpdate.mockResolvedValue({});
    mocks.patientFindUnique.mockResolvedValue({
      id: 'patient-1',
      practiceId: 'practice-A',
      firstName: 'Jo',
      lastName: 'Doe',
      portalCredential: { email: 'p@example.com' },
    });
    const { svc, sessions } = service();

    const result = await svc.login({ email: 'p@example.com', password: 'correct1' }, {});

    expect(sessions.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'patient-1' }),
    );
    expect(result.patient.practiceId).toBe('practice-A');
  });
});
