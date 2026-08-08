import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  auditCreate: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: { PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {} },
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    auditLog: { create: mocks.auditCreate },
  },
}));

vi.mock('./auth.utils', () => ({
  verifyPassword: mocks.verifyPassword,
  passwordNeedsRehash: vi.fn(() => false),
  hashPassword: vi.fn(),
  hashUserAgent: vi.fn(() => 'hashed-user-agent'),
}));

import { AuthService } from './auth.service';
import { AUTH_LIMITS } from './auth.constants';

describe('AuthService distributed account lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue({
      id: 'user-A',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      status: 'active',
      lockedUntil: null,
      failedLoginCount: 4,
      practiceId: 'practice-A',
    });
    mocks.verifyPassword.mockResolvedValue(false);
    mocks.userUpdate
      .mockResolvedValueOnce({ failedLoginCount: 5 })
      .mockResolvedValueOnce({ id: 'user-A' });
    mocks.auditCreate.mockResolvedValue({});
  });

  it('atomically increments failures and locks at the configured threshold', async () => {
    const before = Date.now();
    const service = new AuthService({} as any);

    await expect(
      service.login(
        { email: 'user@example.com', password: 'wrong-password' },
        { ip: '203.0.113.10', userAgent: 'raw-user-agent' },
      ),
    ).rejects.toThrow('Invalid credentials');

    expect(mocks.userUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-A' },
      data: { failedLoginCount: { increment: 1 } },
      select: { failedLoginCount: true },
    });
    const lockUpdate = mocks.userUpdate.mock.calls[1][0];
    expect(lockUpdate.data.failedLoginCount).toBe(0);
    expect(lockUpdate.data.lockedUntil.getTime()).toBeGreaterThanOrEqual(
      before + AUTH_LIMITS.LOGIN_ACCOUNT_LOCK_MS,
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userAgentHash: 'hashed-user-agent' }),
    });
  });
});
