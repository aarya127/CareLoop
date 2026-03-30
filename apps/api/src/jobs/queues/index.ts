// BullMQ queue definitions (producer side)
import { Queue } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { QUEUE_NAMES } from '@careloop/shared';

const connection = getRedisClient();

export const appointmentRemindersQueue = new Queue(QUEUE_NAMES.APPOINTMENT_REMINDERS, { connection });
export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS_REFRESH, { connection });
export const documentCleanupQueue = new Queue(QUEUE_NAMES.DOCUMENT_CLEANUP, { connection });
export const dataExportsQueue = new Queue(QUEUE_NAMES.DATA_EXPORTS, { connection });
export const webhooksQueue = new Queue(QUEUE_NAMES.PROCESS_WEBHOOKS, { connection });
