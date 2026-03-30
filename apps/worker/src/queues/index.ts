import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { JobNames } from '@careloop/types';
import type {
  FinalizeTranscriptJobData,
  SyncGoogleCalendarJobData,
  AppointmentReminderJobData,
  ComputeKpisJobData,
} from '@careloop/types';

export type QueueMap = {
  [JobNames.FINALIZE_TRANSCRIPT]: Queue<FinalizeTranscriptJobData>;
  [JobNames.SYNC_GOOGLE_CALENDAR]: Queue<SyncGoogleCalendarJobData>;
  [JobNames.APPOINTMENT_REMINDER]: Queue<AppointmentReminderJobData>;
  [JobNames.COMPUTE_KPIS]: Queue<ComputeKpisJobData>;
};

export function createQueues(connection: Redis): QueueMap {
  const kpisQueue = new Queue<ComputeKpisJobData>(JobNames.COMPUTE_KPIS, { connection });
  // Schedule nightly KPI computation at 02:00 UTC (BullMQ v5 API)
  kpisQueue.upsertJobScheduler(
    'nightly-kpis',
    { pattern: '0 2 * * *' },
    { name: JobNames.COMPUTE_KPIS, data: { practiceId: 'all', date: '' } }
  );

  return {
    [JobNames.FINALIZE_TRANSCRIPT]: new Queue<FinalizeTranscriptJobData>(
      JobNames.FINALIZE_TRANSCRIPT,
      { connection }
    ),
    [JobNames.SYNC_GOOGLE_CALENDAR]: new Queue<SyncGoogleCalendarJobData>(
      JobNames.SYNC_GOOGLE_CALENDAR,
      { connection }
    ),
    [JobNames.APPOINTMENT_REMINDER]: new Queue<AppointmentReminderJobData>(
      JobNames.APPOINTMENT_REMINDER,
      { connection }
    ),
    [JobNames.COMPUTE_KPIS]: kpisQueue,
  };
}
