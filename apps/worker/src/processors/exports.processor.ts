import type { Job } from 'bullmq';
import type { ExportDataJobData } from '@careloop/shared';

export async function exportsProcessor(
  job: Job<ExportDataJobData>,
): Promise<void> {
  const { resource, format, requestedBy, practiceId } = job.data;
  job.log(`Starting ${format} export of ${resource} for user ${requestedBy} in practice ${practiceId}`);

  // TODO: generate export file and upload to storage, notify user
  void resource;
  void format;
  void requestedBy;
  void practiceId;

  job.log(`Export complete for resource ${resource}`);
}
