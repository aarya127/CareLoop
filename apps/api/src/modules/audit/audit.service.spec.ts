import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: {},
  prisma: {
    auditLog: {
      create: mocks.create,
      findMany: mocks.findMany,
      count: mocks.count,
    },
  },
}));

vi.mock('../../config/redis', () => ({
  getRedisClient: () => ({
    get: mocks.redisGet,
    set: mocks.redisSet,
  }),
}));

import { AuditService } from './audit.service';

describe('AuditService tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
    mocks.create.mockResolvedValue({ id: 'audit-1' });
  });

  it('always applies the authenticated practice to audit-log reads', async () => {
    const service = new AuditService();

    await service.getLog('practice-A', { actorUserId: 'actor-1' });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { practiceId: 'practice-A', actorUserId: 'actor-1' },
      }),
    );
    expect(mocks.count).toHaveBeenCalledWith({
      where: { practiceId: 'practice-A', actorUserId: 'actor-1' },
    });
  });

  it('uses tenant-specific cache keys', async () => {
    const service = new AuditService();

    await service.getLog('practice-A', {});
    await service.getLog('practice-B', {});

    const cacheKeys = mocks.redisGet.mock.calls.map(([key]) => key as string);
    expect(cacheKeys).toHaveLength(2);
    expect(cacheKeys[0]).not.toBe(cacheKeys[1]);
    expect(cacheKeys[0]).toContain('practice-A');
    expect(cacheKeys[1]).toContain('practice-B');
  });

  it('persists the practice on every tenant audit write', async () => {
    const service = new AuditService();

    await service.record({
      practiceId: 'practice-A',
      eventType: 'patient_viewed',
      outcome: 'success',
      actorUserId: 'user-1',
      userAgent: 'Mozilla/5.0 raw value',
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        practiceId: 'practice-A',
        eventType: 'patient_viewed',
        actorUserId: 'user-1',
        userAgentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(mocks.create.mock.calls[0][0].data.userAgentHash).not.toContain('Mozilla');
  });
});
