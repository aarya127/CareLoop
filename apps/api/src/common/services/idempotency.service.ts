import { Injectable, ConflictException } from '@nestjs/common';
import { getRedisClient } from '../../config/redis';

const KEY_PREFIX = 'idempotency:';
const DEFAULT_TTL_SECONDS = 86400; // 24 hours

type IdempotencyStatus = 'processing' | 'completed';

interface StoredResult {
  status: IdempotencyStatus;
  statusCode: number;
  body: unknown;
}

@Injectable()
export class IdempotencyService {
  private get redis() {
    return getRedisClient();
  }

  private key(idempotencyKey: string): string {
    return `${KEY_PREFIX}${idempotencyKey}`;
  }

  /**
   * Try to claim an idempotency key before processing a request.
   * - If the key is new: marks it as "processing" and returns null (caller should proceed).
   * - If the key has a completed result: returns the cached response body.
   * - If the key is still "processing" (concurrent duplicate): throws 409.
   */
  async claim(idempotencyKey: string): Promise<StoredResult | null> {
    const redisKey = this.key(idempotencyKey);
    const processingValue = JSON.stringify({
      status: 'processing',
      statusCode: 202,
      body: null,
    } satisfies StoredResult);

    // Atomic claim: SET ... NX only succeeds if the key is absent. This closes
    // the race where two concurrent requests both read "no key" and both proceed
    // (a GET-then-SET would double-charge payments / double-book appointments).
    const claimed = await this.redis.set(redisKey, processingValue, 'EX', 60, 'NX');
    if (claimed === 'OK') {
      return null; // we won the claim — caller proceeds
    }

    // Key already exists — inspect its state.
    const existing = await this.redis.get(redisKey);
    if (!existing) {
      // Rare: the key expired between the SET NX and this GET. Try once more.
      const retry = await this.redis.set(redisKey, processingValue, 'EX', 60, 'NX');
      if (retry === 'OK') return null;
      throw new ConflictException('A request with this idempotency key is already being processed');
    }

    const stored: StoredResult = JSON.parse(existing);
    if (stored.status === 'processing') {
      throw new ConflictException('A request with this idempotency key is already being processed');
    }
    // Completed — return the cached response for replay.
    return stored;
  }

  /**
   * Store the final response against the idempotency key.
   * Call this after successfully processing the request.
   */
  async complete(
    idempotencyKey: string,
    statusCode: number,
    body: unknown,
    ttlSeconds = DEFAULT_TTL_SECONDS
  ): Promise<void> {
    const stored: StoredResult = { status: 'completed', statusCode, body };
    await this.redis.set(
      this.key(idempotencyKey),
      JSON.stringify(stored),
      'EX',
      ttlSeconds
    );
  }

  /**
   * Remove an idempotency key (e.g. on rollback after a failed transaction).
   */
  async release(idempotencyKey: string): Promise<void> {
    await this.redis.del(this.key(idempotencyKey));
  }
}
