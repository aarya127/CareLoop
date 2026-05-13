// Helper functions to enqueue jobs
import { Queue } from 'bullmq';
import {
  appointmentRemindersQueue,
  dataExportsQueue,
  webhooksQueue,
  documentCleanupQueue,
  analyticsQueue,
  schedulerQueue,
} from '../queues';
import type {
  AppointmentReminderJobData,
  ExportDataJobData,
  ProcessWebhookJobData,
  DocumentCleanupJobData,
  AnalyticsRefreshJobData,
  ReminderScanJobData,
} from '@careloop/shared';

/** Exponential backoff: 5s → 10s → 20s → 40s → 80s (5 attempts). */
const STANDARD_RETRY = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 500 },
  removeOnFail: false, // keep failed jobs visible in dashboard
};

export async function enqueueAppointmentReminder(
  data: AppointmentReminderJobData,
  opts?: Parameters<Queue['add']>[2],
) {
  return appointmentRemindersQueue.add('send-reminder', data, {
    ...STANDARD_RETRY,
    ...opts,
  });
}

export async function enqueueExport(data: ExportDataJobData) {
  return dataExportsQueue.add('export', data, STANDARD_RETRY);
}

export async function enqueueWebhook(data: ProcessWebhookJobData) {
  return webhooksQueue.add('process', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: false,
  });
}

export async function enqueueDocumentCleanup(data: DocumentCleanupJobData) {
  return documentCleanupQueue.add('cleanup', data, STANDARD_RETRY);
}

export async function enqueueAnalyticsRefresh(data: AnalyticsRefreshJobData) {
  return analyticsQueue.add('analytics-refresh', data, STANDARD_RETRY);
}

export async function enqueueReminderScan(data: ReminderScanJobData = {}) {
  return schedulerQueue.add('reminder-scan', data, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  });
}
