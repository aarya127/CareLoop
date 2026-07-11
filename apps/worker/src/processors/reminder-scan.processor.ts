import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@careloop/db';
import { QUEUE_NAMES } from '@careloop/shared';
import type { ReminderScanJobData, AppointmentReminderJobData } from '@careloop/shared';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

// Reuse a single connection + Queue across scans. The scan runs every 60s, so
// creating and tearing down a Redis connection each time (the previous behavior)
// churned connections needlessly.
let remindersQueue: Queue<AppointmentReminderJobData> | null = null;
function getRemindersQueue(): Queue<AppointmentReminderJobData> {
  if (!remindersQueue) {
    const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
    remindersQueue = new Queue<AppointmentReminderJobData>(QUEUE_NAMES.REMINDERS, { connection });
  }
  return remindersQueue;
}

/**
 * Scans the Reminder table for rows that are due (scheduledAt <= scanUpTo)
 * and still pending, then enqueues a send job for each on the REMINDERS queue.
 *
 * A 5-minute look-ahead window means reminders are always enqueued slightly
 * before they're due, giving the send worker time to deliver on time.
 *
 * Idempotency: BullMQ job IDs are set to `reminder:<reminderId>` so a second
 * scan within the same window is a no-op (duplicate job is silently ignored).
 */
export async function reminderScanProcessor(job: Job<ReminderScanJobData>): Promise<void> {
  const scanUpTo = job.data.scanUpTo
    ? new Date(job.data.scanUpTo)
    : (() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 5); // 5-minute look-ahead
        return d;
      })();

  job.log(`[reminder-scan] scanning for pending reminders due before ${scanUpTo.toISOString()}`);

  const pending = await prisma.reminder.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: scanUpTo },
    },
    select: {
      id: true,
      patientId: true,
      practiceId: true,
      appointmentId: true,
      channel: true,
      metadata: true,
    },
    take: 500, // hard cap per scan cycle
  });

  if (pending.length === 0) {
    job.log('[reminder-scan] no pending reminders due');
    return;
  }

  job.log(`[reminder-scan] found ${pending.length} pending reminders`);

  const queue = getRemindersQueue();

  const results = await Promise.allSettled(
    pending.map(async (reminder) => {
      const meta = (reminder.metadata ?? {}) as Record<string, unknown>;
      const to = (meta['to'] as string | undefined) ?? '';
      const content = (meta['body'] as string | undefined) ?? '';

      const data: AppointmentReminderJobData = {
        reminderId: reminder.id,
        appointmentId: reminder.appointmentId ?? '',
        patientId: reminder.patientId,
        practiceId: reminder.practiceId,
        channel: reminder.channel as 'sms' | 'email',
        reminderType: reminder.channel as 'sms' | 'email',
        to,
        content,
      };

      return queue.add('send-reminder', data, {
        jobId: `reminder:${reminder.id}`, // idempotent — duplicate is silently ignored
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: false,
      });
    }),
  );

  const enqueued = results.filter((r) => r.status === 'fulfilled').length;
  const skipped = results.filter((r) => r.status === 'rejected').length;

  job.log(`[reminder-scan] enqueued=${enqueued} skipped/duplicate=${skipped}`);
}
