export const APP_NAME = 'CareLoop';
export const APP_VERSION = '1.0.0';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const APPOINTMENT_DURATION_MINUTES = 60;
export const REMINDER_LEAD_TIME_HOURS = 24;

export const SUPPORTED_LOCALES = ['en-CA', 'en-US', 'fr-CA'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const CURRENCY = 'CAD';

export const REDIS_KEYS = {
  SESSION_PREFIX: 'session:',
  RATE_LIMIT_PREFIX: 'rl:',
  CACHE_ANALYTICS: 'cache:analytics:',
} as const;

export const QUEUE_NAMES = {
  REMINDERS: 'reminders',
  ANALYTICS: 'analytics-refresh',
  DOCUMENTS: 'document-cleanup',
  EXPORTS: 'exports',
  WEBHOOKS: 'webhooks',
} as const;
