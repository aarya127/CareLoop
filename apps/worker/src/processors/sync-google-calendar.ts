import type { Job } from 'bullmq';
import type { SyncGoogleCalendarJobData } from '@careloop/shared';

export async function syncGoogleCalendarProcessor(
  job: Job<SyncGoogleCalendarJobData>,
): Promise<void> {
  const { practiceId, userId, calendarId } = job.data;
  job.log(`Syncing Google Calendar ${calendarId} for user ${userId} (practice ${practiceId})`);

  // TODO: implement OAuth token refresh + calendar event upsert via Google API
  void calendarId;

  job.log(`Google Calendar sync complete for user ${userId}`);
}
