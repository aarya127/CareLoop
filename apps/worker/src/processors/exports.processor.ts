import type { Job } from 'bullmq';
import type { ExportDataJobData } from '@careloop/shared';

export async function exportsProcessor(
  job: Job<ExportDataJobData>,
): Promise<void> {
  const { exportType, format, requestedBy } = job.data;
  job.log(`Starting ${format} export of type ${exportType} for user ${requestedBy}`);

  // TODO: generate export file and upload to storage, notify user
  void exportType; void format; void requestedBy;

  job.log(`Export complete for type ${exportType}`);
}
