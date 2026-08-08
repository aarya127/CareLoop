import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: vi.fn(),
  redis: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  prisma: { $queryRaw: mocks.db },
}));

vi.mock('../../config/redis', () => ({
  getRedisClient: () => ({ ping: mocks.redis }),
}));

import { HealthController } from './health.controller';

describe('HealthController probes', () => {
  const status = vi.fn();
  const reply = { status } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    status.mockReturnValue(reply);
    mocks.db.mockResolvedValue([{ '?column?': 1 }]);
    mocks.redis.mockResolvedValue('PONG');
  });

  it('returns 200 only when all readiness dependencies are available', async () => {
    const result = await new HealthController().readiness(reply);
    expect(status).toHaveBeenCalledWith(200);
    expect(result.status).toBe('ok');
  });

  it('returns 503 when a readiness dependency is unavailable', async () => {
    mocks.db.mockRejectedValueOnce(new Error('database down'));
    const result = await new HealthController().readiness(reply);
    expect(status).toHaveBeenCalledWith(503);
    expect(result).toMatchObject({ status: 'degraded', services: { database: 'down' } });
  });

  it('keeps liveness independent from external dependencies', () => {
    expect(new HealthController().live().status).toBe('ok');
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.redis).not.toHaveBeenCalled();
  });
});
