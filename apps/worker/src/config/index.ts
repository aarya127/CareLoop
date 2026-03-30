export const workerConfig = {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
  },
  concurrency: {
    reminders: Number(process.env.WORKER_CONCURRENCY_REMINDERS ?? 10),
    analytics: Number(process.env.WORKER_CONCURRENCY_ANALYTICS ?? 1),
    documents: Number(process.env.WORKER_CONCURRENCY_DOCUMENTS ?? 2),
    exports: Number(process.env.WORKER_CONCURRENCY_EXPORTS ?? 2),
    webhooks: Number(process.env.WORKER_CONCURRENCY_WEBHOOKS ?? 5),
  },
} as const;
