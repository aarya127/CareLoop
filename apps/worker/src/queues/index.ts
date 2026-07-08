import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { QUEUE_NAMES } from '@careloop/shared';
import type { AnalyticsRefreshJobData, ReminderScanJobData } from '@careloop/shared';

/**
 * Registers the repeatable (interval/cron) jobs that drive the time-based
 * workers. Without this, nothing ever enqueues onto the SCHEDULER or nightly
 * ANALYTICS queues, so the reminder scan and KPI rollup never run. Called once
 * at worker startup; upsertJobScheduler is idempotent across restarts/replicas.
 *
 * Returns the Queue handles so the caller can close them on shutdown.
 */
export async function registerSchedulers(connection: Redis): Promise<Queue[]> {
  // Every minute: scan for reminders due within the look-ahead window and enqueue
  // sends. The scan is idempotent per reminder id, so overlapping runs are safe.
  const schedulerQueue = new Queue<ReminderScanJobData>(QUEUE_NAMES.SCHEDULER, { connection });
  await schedulerQueue.upsertJobScheduler(
    'reminder-scan',
    { every: 60_000 },
    { name: 'reminder-scan', data: {} },
  );

  // Nightly at 02:00: recompute KPIs for every practice. analyticsRefreshProcessor
  // fans out over all practices when practiceId === 'all'.
  const analyticsQueue = new Queue<AnalyticsRefreshJobData>(QUEUE_NAMES.ANALYTICS, { connection });
  await analyticsQueue.upsertJobScheduler(
    'nightly-analytics-refresh',
    { pattern: '0 2 * * *' },
    { name: 'analytics-refresh', data: { practiceId: 'all' } },
  );

  return [schedulerQueue, analyticsQueue];
}
