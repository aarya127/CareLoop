import type { Job } from 'bullmq';
import type { DocumentCleanupJobData } from '@careloop/shared';

export async function documentCleanupProcessor(
  job: Job<DocumentCleanupJobData>,
): Promise<void> {
  const { olderThanDays } = job.data;
  job.log(`Starting document cleanup for documents older than ${olderThanDays} days`);

  // TODO: delete expired/orphaned documents from storage and DB
  void olderThanDays;

  job.log('Document cleanup complete');
}
