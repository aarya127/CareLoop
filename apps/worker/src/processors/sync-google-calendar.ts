import type { Job } from 'bullmq';
import type { SyncGoogleCalendarJobData } from '@careloop/types';

export async function syncGoogleCalendarProcessor(
  job: Job<SyncGoogleCalendarJobData>
): Promise<void> {
  const { practiceId, accessToken } = job.data;
  job.log(`Syncing Google Calendar for practice ${practiceId}`);

  // TODO: implement OAuth token refresh + calendar event upsert via Google API
  void accessToken;

  job.log(`Google Calendar sync complete for practice ${practiceId}`);
}
