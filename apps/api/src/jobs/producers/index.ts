// Helper functions to enqueue jobs
import { appointmentRemindersQueue, dataExportsQueue, webhooksQueue, documentCleanupQueue } from '../queues';
import type { AppointmentReminderJobData, ExportDataJobData, ProcessWebhookJobData, DocumentCleanupJobData } from '@careloop/shared';

export async function enqueueAppointmentReminder(data: AppointmentReminderJobData) {
  return appointmentRemindersQueue.add('send-reminder', data);
}

export async function enqueueExport(data: ExportDataJobData) {
  return dataExportsQueue.add('export', data);
}

export async function enqueueWebhook(data: ProcessWebhookJobData) {
  return webhooksQueue.add('process', data);
}

export async function enqueueDocumentCleanup(data: DocumentCleanupJobData) {
  return documentCleanupQueue.add('cleanup', data);
}
