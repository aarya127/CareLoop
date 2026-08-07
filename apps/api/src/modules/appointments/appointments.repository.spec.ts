import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  advisoryLock: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: {},
  prisma: { $transaction: mocks.transaction },
}));

import { AppointmentsRepository } from './appointments.repository';

describe('AppointmentsRepository atomic booking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.advisoryLock.mockResolvedValue(1);
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: 'appt-1' });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $executeRaw: mocks.advisoryLock,
        appointment: { findFirst: mocks.findFirst, create: mocks.create },
      }),
    );
  });

  it('locks the tenant/provider before checking and inserting', async () => {
    const repository = new AppointmentsRepository();

    await repository.createIfAvailable({
      practiceId: 'practice-A',
      userId: 'user-A',
      providerId: 'provider-A',
      title: 'Checkup',
      start: new Date('2026-03-10T09:00:00Z'),
      end: new Date('2026-03-10T09:30:00Z'),
    });

    expect(mocks.advisoryLock).toHaveBeenCalledTimes(1);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        practiceId: 'practice-A',
        providerId: 'provider-A',
      }),
      select: { id: true },
    });
    expect(mocks.advisoryLock.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.findFirst.mock.invocationCallOrder[0],
    );
    expect(mocks.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.create.mock.invocationCallOrder[0],
    );
  });

  it('does not insert when a conflict exists under the lock', async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: 'existing' });
    const repository = new AppointmentsRepository();

    await expect(
      repository.createIfAvailable({
        practiceId: 'practice-A',
        userId: 'user-A',
        providerId: 'provider-A',
        title: 'Checkup',
        start: new Date('2026-03-10T09:00:00Z'),
        end: new Date('2026-03-10T09:30:00Z'),
      }),
    ).resolves.toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
