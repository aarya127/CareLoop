import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
  userUpdate: vi.fn(),
  userCount: vi.fn(),
  practiceUpdate: vi.fn(),
  transaction: vi.fn(),
  revokeAllUserSessions: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  prisma: {
    user: {
      findFirst: mocks.userFindFirst,
      update: mocks.userUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

import { UsersService } from './users.service';

describe('UsersService session revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindFirst.mockResolvedValue({
      id: 'user-A',
      roles: [{ role: { name: 'staff' } }],
    });
    mocks.userUpdate.mockResolvedValue({ id: 'user-A', status: 'inactive' });
    mocks.userCount.mockResolvedValue(2);
    mocks.practiceUpdate.mockResolvedValue({ id: 'practice-A' });
    mocks.transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
      callback({
        practice: { update: mocks.practiceUpdate },
        user: {
          findFirst: mocks.userFindFirst,
          count: mocks.userCount,
          update: mocks.userUpdate,
        },
      }),
    );
    mocks.revokeAllUserSessions.mockResolvedValue(undefined);
  });

  it('evicts all active sessions before removing a user', async () => {
    const service = new UsersService({
      revokeAllUserSessions: mocks.revokeAllUserSessions,
    } as any);

    await service.remove('practice-A', 'admin-A', 'user-A', 'left practice');

    expect(mocks.revokeAllUserSessions).toHaveBeenCalledWith('user-A', 'user_removed');
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-A' },
        data: expect.objectContaining({ status: 'inactive' }),
      }),
    );
    expect(mocks.userUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.revokeAllUserSessions.mock.invocationCallOrder[0],
    );
  });

  it('rejects self-removal before changing state', async () => {
    const service = new UsersService({
      revokeAllUserSessions: mocks.revokeAllUserSessions,
    } as any);
    await expect(service.remove('practice-A', 'admin-A', 'admin-A')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects removal of the last active administrator', async () => {
    mocks.userFindFirst.mockResolvedValueOnce({
      id: 'admin-B',
      roles: [{ role: { name: 'ADMIN' } }],
    });
    mocks.userCount.mockResolvedValueOnce(1);
    const service = new UsersService({
      revokeAllUserSessions: mocks.revokeAllUserSessions,
    } as any);

    await expect(service.remove('practice-A', 'admin-A', 'admin-B')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.revokeAllUserSessions).not.toHaveBeenCalled();
  });

  it('rejects empty user updates and normalizes allowed names', async () => {
    const service = new UsersService({
      revokeAllUserSessions: mocks.revokeAllUserSessions,
    } as any);

    await expect(service.update('practice-A', 'user-A', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await service.update('practice-A', 'user-A', { firstName: '  Ada  ' });

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { firstName: 'Ada' } }),
    );
  });
});
