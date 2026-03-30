import Redis from 'ioredis';
import { JobName } from '@careloop/types';
import { createWorkers } from './workers';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

connection.on('connect', () => console.info('[Redis] connected'));
connection.on('error', (err) => console.error('[Redis] error:', err));

const workers = createWorkers(connection);

console.info(
  `[Worker] processing queues: ${Object.values(JobName).join(', ')}`
);

async function shutdown() {
  console.info('[Worker] shutting down...');
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
