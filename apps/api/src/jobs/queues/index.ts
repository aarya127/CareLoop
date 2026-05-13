// BullMQ queue definitions (producer side)
import { Queue } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { QUEUE_NAMES, DLQ_QUEUE_NAME } from '@careloop/shared';

const connection = getRedisClient();

export const appointmentRemindersQueue = new Queue(QUEUE_NAMES.REMINDERS, { connection });
export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, { connection });
export const documentCleanupQueue = new Queue(QUEUE_NAMES.DOCUMENTS, { connection });
export const dataExportsQueue = new Queue(QUEUE_NAMES.EXPORTS, { connection });
export const webhooksQueue = new Queue(QUEUE_NAMES.WEBHOOKS, { connection });
export const schedulerQueue = new Queue(QUEUE_NAMES.SCHEDULER, { connection });
export const deadLetterQueue = new Queue(DLQ_QUEUE_NAME, { connection });

/** Used by JobsService to iterate all queues for metrics. */
export const ALL_QUEUES = [
  { name: QUEUE_NAMES.REMINDERS, queue: appointmentRemindersQueue },
  { name: QUEUE_NAMES.ANALYTICS, queue: analyticsQueue },
  { name: QUEUE_NAMES.DOCUMENTS, queue: documentCleanupQueue },
  { name: QUEUE_NAMES.EXPORTS, queue: dataExportsQueue },
  { name: QUEUE_NAMES.WEBHOOKS, queue: webhooksQueue },
  { name: QUEUE_NAMES.SCHEDULER, queue: schedulerQueue },
  { name: DLQ_QUEUE_NAME, queue: deadLetterQueue },
];
