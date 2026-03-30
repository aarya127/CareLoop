import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { JobNames, QUEUE_NAMES } from '@careloop/shared';
import { finalizeTranscriptProcessor } from './processors/finalize-transcript';
import { syncGoogleCalendarProcessor } from './processors/sync-google-calendar';
import { appointmentReminderProcessor } from './processors/appointment-reminder';
import { computeKpisProcessor } from './processors/compute-kpis';
import { remindersProcessor } from './processors/reminders.processor';
import { analyticsRefreshProcessor } from './processors/analytics-refresh.processor';
import { documentCleanupProcessor } from './processors/document-cleanup.processor';
import { exportsProcessor } from './processors/exports.processor';
import { webhooksProcessor } from './processors/webhooks.processor';

export function createWorkers(connection: Redis): Worker[] {
  return [
    // Legacy workers (kept for backward compatibility)
    new Worker(JobNames.FINALIZE_TRANSCRIPT, finalizeTranscriptProcessor, {
      connection,
      concurrency: 5,
    }),
    new Worker(JobNames.SYNC_GOOGLE_CALENDAR, syncGoogleCalendarProcessor, {
      connection,
      concurrency: 3,
    }),
    new Worker(JobNames.APPOINTMENT_REMINDER, appointmentReminderProcessor, {
      connection,
      concurrency: 10,
    }),
    new Worker(JobNames.COMPUTE_KPIS, computeKpisProcessor, {
      connection,
      concurrency: 1,
    }),
    // New spec-aligned workers
    new Worker(QUEUE_NAMES.REMINDERS, remindersProcessor, {
      connection,
      concurrency: 10,
    }),
    new Worker(QUEUE_NAMES.ANALYTICS, analyticsRefreshProcessor, {
      connection,
      concurrency: 1,
    }),
    new Worker(QUEUE_NAMES.DOCUMENTS, documentCleanupProcessor, {
      connection,
      concurrency: 2,
    }),
    new Worker(QUEUE_NAMES.EXPORTS, exportsProcessor, {
      connection,
      concurrency: 2,
    }),
    new Worker(QUEUE_NAMES.WEBHOOKS, webhooksProcessor, {
      connection,
      concurrency: 5,
    }),
  ];
}
