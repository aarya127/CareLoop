import { beforeEach, describe, expect, it, vi } from 'vitest';

const evalScript = vi.hoisted(() => vi.fn());
vi.mock('../../config/redis', () => ({
  getRedisClient: () => ({ eval: evalScript }),
}));

import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('increments, expires, and blocks in one atomic Redis operation', async () => {
    evalScript.mockResolvedValue([11, 59_000, 1, 60_000]);
    const result = await new RedisThrottlerStorage().increment(
      'client-A',
      60_000,
      10,
      60_000,
      'default',
    );

    expect(evalScript).toHaveBeenCalledOnce();
    expect(evalScript.mock.calls[0]).toEqual([
      expect.stringContaining("redis.call('INCR'"),
      2,
      'throttler:default:client-A',
      'throttler:block:default:client-A',
      60_000,
      10,
      60_000,
    ]);
    expect(result).toEqual({
      totalHits: 11,
      timeToExpire: 59_000,
      isBlocked: true,
      timeToBlockExpire: 60_000,
    });
  });
});
