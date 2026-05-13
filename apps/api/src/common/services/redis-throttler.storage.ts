import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { getRedisClient } from '../../config/redis';

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

    // Check if the client is currently in a block window
    const blockTtlMs = await redis.pttl(blockKey);
    if (blockTtlMs > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockTtlMs,
      };
    }

    // Increment hit counter
    const hits = await redis.incr(hitKey);

    // Set TTL only on first hit (INCR on a new key returns 1)
    if (hits === 1) {
      await redis.pexpire(hitKey, ttl);
    }

    const timeToExpireMs = Math.max(await redis.pttl(hitKey), 0);

    if (hits > limit) {
      // Activate block window (only set once — NX prevents overwrite)
      await redis.set(blockKey, '1', 'PX', blockDuration, 'NX');
      return {
        totalHits: hits,
        timeToExpire: timeToExpireMs,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return {
      totalHits: hits,
      timeToExpire: timeToExpireMs,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
