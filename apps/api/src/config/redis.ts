import Redis from 'ioredis';
import { env } from './env';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(env.redisUrl, { maxRetriesPerRequest: 3 });
    client.on('error', (err) => console.error('[Redis]', err));
  }
  return client;
}
