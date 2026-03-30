// BullMQ queue definitions (producer side)
import { Queue } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { QUEUE_NAMES } from '@careloop/shared';

const connection = getRedisClient();

export const appointmentRemindersQueue = new Queue(QUEUE_NAMES.REMINDERS, { connection });
export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, { connection });
export const documentCleanupQueue = new Queue(QUEUE_NAMES.DOCUMENTS, { connection });
export const dataExportsQueue = new Queue(QUEUE_NAMES.EXPORTS, { connection });
export const webhooksQueue = new Queue(QUEUE_NAMES.WEBHOOKS, { connection });
