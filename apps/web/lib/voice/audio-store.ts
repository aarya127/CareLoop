/**
 * Audio buffer store for Twilio <Play> audio serving.
 *
 * Backed by Redis when REDIS_URL is set — required in production, where
 * serverless instances don't share memory (Twilio's fetch of the audio URL
 * usually lands on a different instance than the one that synthesized it).
 * Falls back to an in-process Map for local dev without Redis.
 */

import { randomBytes } from 'node:crypto';
import Redis from 'ioredis';

const TTL_SECONDS = 5 * 60;
const KEY_PREFIX = 'voice:audio:';

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  redis = url ? new Redis(url, { maxRetriesPerRequest: 2, enableOfflineQueue: true }) : null;
  if (!redis && process.env.NODE_ENV === 'production') {
    console.warn(
      '[audio-store] REDIS_URL not set — falling back to in-memory storage, which breaks across serverless instances',
    );
  }
  return redis;
}

const memoryStore = new Map<string, Buffer>();

/** Store a buffer under an unguessable ID, return the ID. */
export async function storeAudioBuffer(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  // The serving route is unauthenticated (Twilio <Play> fetches it), so the id
  // is the only access control — it must be crypto-random, not sequential.
  const id = `audio-${randomBytes(16).toString('hex')}`;
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);

  const client = getRedis();
  if (client) {
    await client.set(KEY_PREFIX + id, data, 'EX', TTL_SECONDS);
    return id;
  }

  memoryStore.set(id, data);
  setTimeout(() => memoryStore.delete(id), TTL_SECONDS * 1000);
  return id;
}

export async function getAudioBuffer(id: string): Promise<Buffer | undefined> {
  const client = getRedis();
  if (client) {
    const data = await client.getBuffer(KEY_PREFIX + id);
    return data ?? undefined;
  }
  return memoryStore.get(id);
}

/** Build a URL for serving an audio buffer via the telephony audio route. */
export function getAudioUrl(baseUrl: string, id: string): string {
  return `${baseUrl}/api/voice/telephony/audio/${encodeURIComponent(id)}`;
}
