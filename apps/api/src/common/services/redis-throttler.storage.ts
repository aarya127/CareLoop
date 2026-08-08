import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { getRedisClient } from '../../config/redis';

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
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  async increment(
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
    const result = (await redis.eval(
      INCREMENT_SCRIPT,
      2,
      hitKey,
      blockKey,
      ttl,
      limit,
      blockDuration,
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
