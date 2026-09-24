import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoneException, NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userRoleFindMany: vi.fn(),
  tokenFindUnique: vi.fn(),
  tokenCreate: vi.fn(),
  tokenUpdate: vi.fn(),
  tokenUpdateMany: vi.fn(),
  auditCreate: vi.fn(),
  hashPassword: vi.fn(),
  hashToken: vi.fn((raw: string) => `hashed:${raw}`),
  randomToken: vi.fn(() => 'raw-reset-token'),
  revokeAllUserSessions: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: { PrismaClientKnownRequestError: class {} },
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    userRole: { findMany: mocks.userRoleFindMany },
    passwordResetToken: {
      findUnique: mocks.tokenFindUnique,
      create: mocks.tokenCreate,
      update: mocks.tokenUpdate,
      updateMany: mocks.tokenUpdateMany,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));

vi.mock('./auth.utils', () => ({
  hashPassword: mocks.hashPassword,
  hashToken: mocks.hashToken,
  randomToken: mocks.randomToken,
  hashUserAgent: vi.fn(),
  passwordNeedsRehash: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { AuthService } from './auth.service';

function service() {
  const sessionService = {
    revokeAllUserSessions: mocks.revokeAllUserSessions,
    createSession: mocks.createSession.mockResolvedValue({
      rawToken: 'new-session-token',
      sessionId: 'sess-new',
    }),
  };
  const email = { send: vi.fn().mockResolvedValue('message-id') };
  return { svc: new AuthService(sessionService as any, email as any), sessionService, email };
}

describe('AuthService.forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auditCreate.mockResolvedValue({});
    mocks.tokenCreate.mockResolvedValue({});
  });

  it('creates a reset token and sends an email when the account exists', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', firstName: 'Jo', status: 'active' });
    const { svc, email } = service();

    await svc.forgotPassword({ email: 'jo@example.com' }, {});

    expect(mocks.tokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
    );
    expect(email.send).toHaveBeenCalled();
  });

  it('resolves silently (no enumeration) when the email does not match any account', async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    const { svc, email } = service();

    await expect(svc.forgotPassword({ email: 'nobody@example.com' }, {})).resolves.toBeUndefined();
    expect(mocks.tokenCreate).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('resolves silently for a deactivated account too (same response as unknown email)', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', firstName: 'Jo', status: 'disabled' });
    const { svc } = service();

    await expect(svc.forgotPassword({ email: 'jo@example.com' }, {})).resolves.toBeUndefined();
    expect(mocks.tokenCreate).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashPassword.mockResolvedValue('new-hash');
    mocks.userUpdate.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    // Only reached on a successful reset (toSafeUser at the end) — harmless
    // to have set up for the rejection-path tests too, since they never get there.
    mocks.userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'jo@example.com',
      firstName: 'Jo',
      lastName: 'Doe',
    });
    mocks.userRoleFindMany.mockResolvedValue([]);
  });

  function validToken(overrides: Record<string, any> = {}) {
    return {
      id: 'token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', email: 'jo@example.com', practiceId: 'practice-A' },
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

  it('rejects a double-consume race where the token was used concurrently', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken());
    mocks.tokenUpdateMany.mockResolvedValue({ count: 0 });
    const { svc } = service();

    await expect(
      svc.resetPassword('raw-token', { password: 'longenough1' }, {}),
    ).rejects.toBeInstanceOf(GoneException);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('on success: updates the password, revokes every session, and starts a fresh one', async () => {
    mocks.tokenFindUnique.mockResolvedValue(validToken());
    mocks.tokenUpdateMany.mockResolvedValue({ count: 1 });
    const { svc, sessionService } = service();

    const result = await svc.resetPassword('raw-token', { password: 'longenough1' }, {});

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ passwordHash: 'new-hash' }),
      }),
    );
    expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith('user-1', 'password_reset');
    expect(sessionService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(result.sessionToken).toBe('new-session-token');
  });
});
