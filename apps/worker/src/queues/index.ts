import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { JobName } from '@careloop/types';
import type {
  FinalizeTranscriptJobData,
  SyncGoogleCalendarJobData,
  AppointmentReminderJobData,
  ComputeKpisJobData,
} from '@careloop/types';

export type QueueMap = {
  [JobName.FINALIZE_TRANSCRIPT]: Queue<FinalizeTranscriptJobData>;
  [JobName.SYNC_GOOGLE_CALENDAR]: Queue<SyncGoogleCalendarJobData>;
  [JobName.APPOINTMENT_REMINDER]: Queue<AppointmentReminderJobData>;
  [JobName.COMPUTE_KPIS]: Queue<ComputeKpisJobData>;
};

export function createQueues(connection: Redis): QueueMap {
  return {
    [JobName.FINALIZE_TRANSCRIPT]: new Queue(JobName.FINALIZE_TRANSCRIPT, {
      connection,
    }),
    [JobName.SYNC_GOOGLE_CALENDAR]: new Queue(JobName.SYNC_GOOGLE_CALENDAR, {
      connection,
    }),
    [JobName.APPOINTMENT_REMINDER]: new Queue(JobName.APPOINTMENT_REMINDER, {
      connection,
    }),
    [JobName.COMPUTE_KPIS]: new Queue(JobName.COMPUTE_KPIS, {
      connection,
      defaultJobOptions: {
        repeat: { pattern: '0 2 * * *' }, // nightly at 02:00
      },
    }),
  };
}
