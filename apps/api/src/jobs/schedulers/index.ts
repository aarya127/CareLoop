// BullMQ recurring job schedulers
import { appointmentRemindersQueue, analyticsQueue } from '../queues';

export async function setupSchedulers(): Promise<void> {
  await analyticsQueue.upsertJobScheduler(
    'daily-analytics-refresh',
    { pattern: '0 2 * * *' },
    { name: 'analytics-refresh', data: { scope: 'daily' } },
  );

  await appointmentRemindersQueue.upsertJobScheduler(
    'hourly-reminder-check',
    { pattern: '0 * * * *' },
    { name: 'check-upcoming', data: {} },
  );
}
