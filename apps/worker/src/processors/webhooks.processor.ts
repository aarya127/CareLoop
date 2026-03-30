import type { Job } from 'bullmq';
import type { ProcessWebhookJobData } from '@careloop/shared';

export async function webhooksProcessor(
  job: Job<ProcessWebhookJobData>,
): Promise<void> {
  const { provider, event, payload } = job.data;
  job.log(`Processing ${provider} webhook event: ${event}`);

  // TODO: route to appropriate handler based on provider + event
  void payload;

  job.log(`Webhook processed: ${provider}/${event}`);
}
