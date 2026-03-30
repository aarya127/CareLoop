import { Worker } from 'bullmq';
import type Redis from 'ioredis';
import { JobName } from '@careloop/types';
import { finalizeTranscriptProcessor } from './processors/finalize-transcript';
import { syncGoogleCalendarProcessor } from './processors/sync-google-calendar';
import { appointmentReminderProcessor } from './processors/appointment-reminder';
import { computeKpisProcessor } from './processors/compute-kpis';

export function createWorkers(connection: Redis): Worker[] {
  return [
    new Worker(JobName.FINALIZE_TRANSCRIPT, finalizeTranscriptProcessor, {
      connection,
      concurrency: 5,
    }),
    new Worker(JobName.SYNC_GOOGLE_CALENDAR, syncGoogleCalendarProcessor, {
      connection,
      concurrency: 3,
    }),
    new Worker(JobName.APPOINTMENT_REMINDER, appointmentReminderProcessor, {
      connection,
      concurrency: 10,
    }),
    new Worker(JobName.COMPUTE_KPIS, computeKpisProcessor, {
      connection,
      concurrency: 1,
    }),
  ];
}
