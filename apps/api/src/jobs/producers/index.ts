// Helper functions to enqueue jobs
import { Queue } from 'bullmq';
import { appointmentRemindersQueue, dataExportsQueue, webhooksQueue, documentCleanupQueue } from '../queues';
import type { AppointmentReminderJobData, ExportDataJobData, ProcessWebhookJobData, DocumentCleanupJobData } from '@careloop/shared';

export async function enqueueAppointmentReminder(
  data: AppointmentReminderJobData,
  opts?: Parameters<Queue['add']>[2],
) {
  return appointmentRemindersQueue.add('send-reminder', data, opts);
}

export async function enqueueExport(data: ExportDataJobData) {
  return dataExportsQueue.add('export', data);
}

export async function enqueueWebhook(data: ProcessWebhookJobData) {
  return webhooksQueue.add('process', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

export async function enqueueDocumentCleanup(data: DocumentCleanupJobData) {
  return documentCleanupQueue.add('cleanup', data);
}
