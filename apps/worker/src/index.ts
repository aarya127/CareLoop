import Redis from 'ioredis';
import type { Queue } from 'bullmq';
import { JobNames } from '@careloop/shared';
import { createWorkers } from './workers';
import { registerSchedulers } from './queues';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

connection.on('connect', () => console.info('[Redis] connected'));
connection.on('error', (err) => console.error('[Redis] error:', err));

const workers = createWorkers(connection);

// Register repeatable jobs (reminder scan + nightly analytics). Without this the
// SCHEDULER/ANALYTICS queues are never fed and those workers sit idle forever.
let schedulerQueues: Queue[] = [];
registerSchedulers(connection)
  .then((queues) => {
    schedulerQueues = queues;
    console.info('[Worker] schedulers registered (reminder-scan every 60s, nightly analytics)');
  })
  .catch((err) => console.error('[Worker] failed to register schedulers:', err));

console.info(`[Worker] processing queues: ${Object.values(JobNames).join(', ')}`);

async function shutdown() {
  console.info('[Worker] shutting down...');
  await Promise.all(workers.map((w: { close: () => Promise<void> }) => w.close()));
  await Promise.all(schedulerQueues.map((q) => q.close()));
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
