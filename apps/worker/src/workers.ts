import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { JobNames, QUEUE_NAMES, DLQ_QUEUE_NAME } from '@careloop/shared';
import { prisma, Prisma } from '@careloop/db';
import { finalizeTranscriptProcessor } from './processors/finalize-transcript';
import { syncGoogleCalendarProcessor } from './processors/sync-google-calendar';
import { appointmentReminderProcessor } from './processors/appointment-reminder';
import { computeKpisProcessor } from './processors/compute-kpis';
import { remindersProcessor } from './processors/reminders.processor';
import { analyticsRefreshProcessor } from './processors/analytics-refresh.processor';
import { documentCleanupProcessor } from './processors/document-cleanup.processor';
import { exportsProcessor } from './processors/exports.processor';
import { webhooksProcessor } from './processors/webhooks.processor';
import { reminderScanProcessor } from './processors/reminder-scan.processor';

// ── Shared retry policy (mirrors producer STANDARD_RETRY) ───────────────────
const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 5000 },
};

/**
 * Attaches a `failed` event handler to a Worker.
 * On final failure (attemptsMade === attempts), writes a dead-letter record to
 * the FailedJob table so ops staff can review and manually retry.
 */
function withFailedHandler(worker: Worker): Worker {
  worker.on('failed', async (job, err) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? DEFAULT_JOB_OPTIONS.attempts;
    const isFinal = job.attemptsMade >= maxAttempts;

    if (isFinal) {
      const practiceId = (job.data as Record<string, unknown>).practiceId as string | undefined;

      await prisma.failedJob
        .create({
          data: {
            id: `${job.queueName}:${job.id}:${Date.now()}`,
            queue: job.queueName,
            jobId: job.id ?? '',
            jobName: job.name,
            data: job.data as Prisma.InputJsonValue,
            failReason: err.message,
            attemptsMade: job.attemptsMade,
            practiceId: practiceId ?? null,
          },
        })
        .catch((dbErr: unknown) =>
          console.error(`[dead-letter] Failed to record dead-letter for job ${job.id}:`, dbErr),
        );

      console.error(
        `[dead-letter] job=${job.id} queue=${job.queueName} name=${job.name} attempts=${job.attemptsMade} error=${err.message}`,
      );
    }
  });

  return worker;
}

export function createWorkers(connection: Redis): Worker[] {
  const workerOptions = { connection };

  // Legacy workers — concurrency kept, retry policy added
  // Note: defaultJobOptions lives on the Queue, not the Worker — removed here.
  const legacyWorkers: Worker[] = [
    new Worker(JobNames.FINALIZE_TRANSCRIPT, finalizeTranscriptProcessor, {
      ...workerOptions,
      concurrency: 5,
    }),
    new Worker(JobNames.SYNC_GOOGLE_CALENDAR, syncGoogleCalendarProcessor, {
      ...workerOptions,
      concurrency: 3,
    }),
    new Worker(JobNames.APPOINTMENT_REMINDER, appointmentReminderProcessor, {
      ...workerOptions,
      concurrency: 10,
    }),
    new Worker(JobNames.COMPUTE_KPIS, computeKpisProcessor, { ...workerOptions, concurrency: 1 }),
  ];

  // New spec-aligned workers
  const newWorkers: Worker[] = [
    new Worker(QUEUE_NAMES.REMINDERS, remindersProcessor, { ...workerOptions, concurrency: 10 }),
    new Worker(QUEUE_NAMES.ANALYTICS, analyticsRefreshProcessor, {
      ...workerOptions,
      concurrency: 1,
    }),
    new Worker(QUEUE_NAMES.DOCUMENTS, documentCleanupProcessor, {
      ...workerOptions,
      concurrency: 2,
    }),
    new Worker(QUEUE_NAMES.EXPORTS, exportsProcessor, { ...workerOptions, concurrency: 2 }),
    new Worker(QUEUE_NAMES.WEBHOOKS, webhooksProcessor, { ...workerOptions, concurrency: 5 }),
    new Worker(QUEUE_NAMES.SCHEDULER, reminderScanProcessor, { ...workerOptions, concurrency: 1 }),
  ];

  const allWorkers = [...legacyWorkers, ...newWorkers];
  allWorkers.forEach(withFailedHandler);
  return allWorkers;
}
