// BullMQ recurring job schedulers
// All schedules are in UTC. Each call to upsertJobScheduler is idempotent.
import { analyticsQueue, documentCleanupQueue, schedulerQueue } from '../queues';

export async function setupSchedulers(): Promise<void> {
  // ── Nightly analytics rollup — 02:00 UTC ────────────────────────────────
  // Processor handles practiceId='all' by iterating all active practices.
  await analyticsQueue.upsertJobScheduler(
    'nightly-analytics-rollup',
    { pattern: '0 2 * * *' },
    { name: 'analytics-refresh', data: { practiceId: 'all' } },
  );

  // ── Nightly document cleanup — 03:00 UTC ────────────────────────────────
  // Marks stale uploads (> 24h in 'uploading' state) and soft-deleted docs.
  await documentCleanupQueue.upsertJobScheduler(
    'nightly-document-cleanup',
    { pattern: '0 3 * * *' },
    { name: 'cleanup', data: { practiceId: 'all', olderThanDays: 1 } },
  );

  // ── Hourly reminder scan — every hour at :00 ────────────────────────────
  // Finds pending Reminder rows due in the next 5 minutes and enqueues sends.
  await schedulerQueue.upsertJobScheduler(
    'hourly-reminder-scan',
    { pattern: '0 * * * *' },
    { name: 'reminder-scan', data: {} },
  );
}
