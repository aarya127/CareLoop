import { Injectable } from '@nestjs/common';
import { prisma } from '@careloop/db';
import { ALL_QUEUES } from './queues';

export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueHealth {
  queues: QueueMetrics[];
  totalFailed: number;
  totalWaiting: number;
  collectedAt: string;
}

@Injectable()
export class JobsService {
  /** Returns live BullMQ counts for all queues. */
  async getQueueMetrics(): Promise<QueueHealth> {
    const queues = await Promise.all(
      ALL_QUEUES.map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
          'paused',
        );
        return {
          name,
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          delayed: counts.delayed ?? 0,
          paused: counts.paused ?? 0,
        } satisfies QueueMetrics;
      }),
    );

    return {
      queues,
      totalFailed: queues.reduce((sum, q) => sum + q.failed, 0),
      totalWaiting: queues.reduce((sum, q) => sum + q.waiting + q.delayed, 0),
      collectedAt: new Date().toISOString(),
    };
  }

  /** Returns dead-lettered jobs from the DB (all retries exhausted). */
  async listFailedJobs(filter?: {
    queue?: string;
    practiceId?: string;
    limit?: number;
  }) {
    return prisma.failedJob.findMany({
      where: {
        ...(filter?.queue ? { queue: filter.queue } : {}),
        ...(filter?.practiceId ? { practiceId: filter.practiceId } : {}),
        retriedAt: null, // only show unresolved
      },
      orderBy: { failedAt: 'desc' },
      take: filter?.limit ?? 100,
    });
  }

  /** Marks a dead-letter record as retried (caller must re-enqueue separately). */
  async markRetried(id: string) {
    return prisma.failedJob.update({
      where: { id },
      data: { retriedAt: new Date() },
    });
  }
}
