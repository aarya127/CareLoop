import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
  roleUpsert: vi.fn(),
  userCreate: vi.fn(),
  userRoleCreate: vi.fn(),
  auditCreate: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: {},
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    auditLog: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));

vi.mock('./auth.utils', () => ({
  hashPassword: mocks.hashPassword,
  passwordNeedsRehash: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('user registration tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue('password-hash');
    mocks.roleUpsert.mockResolvedValue({ id: 7 });
    mocks.userCreate.mockResolvedValue({ id: 'new-user' });
    mocks.userRoleCreate.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        role: { upsert: mocks.roleUpsert },
        user: { create: mocks.userCreate },
        userRole: { create: mocks.userRoleCreate },
      }),
    );
  });

  it('controller derives practice and actor from the admin session', async () => {
    const register = vi.fn().mockResolvedValue({ userId: 'new-user' });
    const controller = new AuthController({ register } as unknown as AuthService, {} as any);
    const dto = {
      email: 'new@example.com',
      password: 'long-password',
      firstName: 'New',
      lastName: 'User',
      role: 'staff' as const,
    };

    await controller.register(dto, {
      user: { id: 'admin-A', practiceId: 'practice-A' },
    });

    expect(register).toHaveBeenCalledWith('practice-A', 'admin-A', dto);
  });

  it('ignores a forged practiceId and atomically creates the user in the admin practice', async () => {
    const service = new AuthService({} as any);
    const dto = {
      email: 'new@example.com',
      password: 'long-password',
      firstName: ' New ',
      lastName: ' User ',
      role: 'manager' as const,
      practiceId: 'practice-B',
    };

    await service.register('practice-A', 'admin-A', dto);

    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          practiceId: 'practice-A',
          firstName: 'New',
          lastName: 'User',
        }),
      }),
    );
    expect(mocks.userRoleCreate).toHaveBeenCalledTimes(1);
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        practiceId: 'practice-A',
        actorUserId: 'admin-A',
        targetUserId: 'new-user',
      }),
    });
  });

  it('defensively rejects service-account role assignment to a user', async () => {
    const service = new AuthService({} as any);

    await expect(
      service.register('practice-A', 'admin-A', {
        email: 'new@example.com',
        password: 'long-password',
        firstName: 'New',
        lastName: 'User',
        role: 'service_account',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
