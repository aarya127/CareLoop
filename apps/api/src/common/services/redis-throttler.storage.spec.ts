import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  describe('when Redis is unavailable', () => {
    afterEach(() => vi.useRealTimers());

    it('falls back to in-memory counting when Redis errors', async () => {
      evalScript.mockRejectedValue(new Error('getaddrinfo ENOTFOUND redis.example'));
      const storage = new RedisThrottlerStorage();

      const result = await storage.increment('client-A', 60_000, 10, 60_000, 'default');

      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
    });

    it('falls back instead of hanging when Redis never answers', async () => {
      vi.useFakeTimers();
      evalScript.mockReturnValue(new Promise(() => {}));
      const storage = new RedisThrottlerStorage();

      const pending = storage.increment('client-A', 60_000, 10, 60_000, 'default');
      await vi.advanceTimersByTimeAsync(1000);

      await expect(pending).resolves.toMatchObject({ totalHits: 1, isBlocked: false });
    });

    it('still enforces the limit while falling back', async () => {
      evalScript.mockRejectedValue(new Error('connection refused'));
      const storage = new RedisThrottlerStorage();

      let last;
      for (let i = 0; i < 3; i++) {
        last = await storage.increment('client-A', 60_000, 2, 60_000, 'default');
      }

      expect(last).toMatchObject({ totalHits: 3, isBlocked: true });
    });
  });
});
