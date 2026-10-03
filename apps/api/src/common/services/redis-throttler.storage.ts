import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorageService, type ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { getRedisClient } from '../../config/redis';

const REDIS_TIMEOUT_MS = 1000;
const FALLBACK_WARN_INTERVAL_MS = 60_000;

const INCREMENT_SCRIPT = `
local blockTtl = redis.call('PTTL', KEYS[2])
if blockTtl > 0 then
  return { tonumber(ARGV[2]) + 1, 0, 1, blockTtl }
end

local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local hitTtl = math.max(redis.call('PTTL', KEYS[1]), 0)

if hits > tonumber(ARGV[2]) then
  local duration = tonumber(ARGV[3])
  if duration <= 0 then duration = tonumber(ARGV[1]) end
  redis.call('SET', KEYS[2], '1', 'PX', duration, 'NX')
  return { hits, hitTtl, 1, math.max(redis.call('PTTL', KEYS[2]), 0) }
end

return { hits, hitTtl, 0, 0 }
`;

/**
 * Redis-backed throttler storage for @nestjs/throttler v6.
 *
 * Uses INCR + PEXPIRE for atomic hit counting, ensuring that rate limit
 * counters are shared across all horizontally-scaled API instances (not
 * per-process as with the default in-memory store).
 *
 * Key format: throttler:<throttlerName>:<clientKey>
 * Block key:  throttler:block:<throttlerName>:<clientKey>
 *
 * This guard runs on every request, so if Redis is unreachable or slow it falls
 * back to per-instance in-memory counting rather than hanging (or failing open).
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly fallback = new ThrottlerStorageService();
  private lastFallbackWarnAt = 0;

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.incrementInRedis(key, ttl, limit, blockDuration, throttlerName);
    } catch (err) {
      const now = Date.now();
      if (now - this.lastFallbackWarnAt >= FALLBACK_WARN_INTERVAL_MS) {
        this.lastFallbackWarnAt = now;
        this.logger.warn(
          `Redis unavailable, using in-memory rate limiting: ${err instanceof Error ? err.message : err}`,
        );
      }
      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  private async incrementInRedis(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = getRedisClient();
    const hitKey = `throttler:${throttlerName}:${key}`;
    const blockKey = `throttler:block:${throttlerName}:${key}`;

    // One Lua operation makes INCR + expiry + blocking atomic. The previous
    // multi-command sequence could leave an immortal counter if the process
    // died after INCR but before PEXPIRE.
    const result = (await withTimeout(
      redis.eval(INCREMENT_SCRIPT, 2, hitKey, blockKey, ttl, limit, blockDuration),
      REDIS_TIMEOUT_MS,
    )) as [number, number, number, number];
    const [hits, timeToExpireMs, blocked, timeToBlockExpire] = result.map(Number);

    return {
      totalHits: hits,
      timeToExpire: timeToExpireMs,
      isBlocked: blocked === 1,
      timeToBlockExpire,
    };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis command timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
