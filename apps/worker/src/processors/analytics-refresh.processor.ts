import type { Job } from 'bullmq';
import type { AnalyticsRefreshJobData } from '@careloop/shared';

export async function analyticsRefreshProcessor(
  job: Job<AnalyticsRefreshJobData>,
): Promise<void> {
  const { practiceId } = job.data;
  job.log(`Starting analytics refresh for practice: ${practiceId}`);

  // TODO: run aggregation queries and cache results
  void practiceId;

  job.log(`Analytics refresh complete for practice: ${practiceId}`);
}
