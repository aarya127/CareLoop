import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { DocumentCleanupJobData } from '@careloop/shared';

async function cleanupForPractice(practiceId: string, olderThanDays: number): Promise<{ stale: number; deleted: number }> {
  const staleThreshold = new Date();
  staleThreshold.setHours(staleThreshold.getHours() - olderThanDays * 24);

  // Mark stale uploads as deleted: status='uploading' for longer than threshold
  const staleResult = await prisma.document.updateMany({
    where: {
      practiceId,
      status: 'uploading',
      createdAt: { lt: staleThreshold },
    },
    data: { status: 'deleted' },
  });

  // Hard-delete from DB rows that have been soft-deleted for > 90 days
  // (storage key deletion from S3 is a TODO once S3 is wired up)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const deletedResult = await prisma.document.deleteMany({
    where: {
      practiceId,
      status: 'deleted',
      updatedAt: { lt: ninetyDaysAgo },
    },
  });

  return { stale: staleResult.count, deleted: deletedResult.count };
}

export async function documentCleanupProcessor(
  job: Job<DocumentCleanupJobData>,
): Promise<void> {
  const { practiceId, olderThanDays } = job.data;

  if (practiceId === 'all') {
    job.log(`Document cleanup: all practices, stale threshold=${olderThanDays}d`);
    const practices = await prisma.practice.findMany({ select: { id: true } });
    let totalStale = 0;
    let totalDeleted = 0;
    await Promise.all(
      practices.map(async (p) => {
        const { stale, deleted } = await cleanupForPractice(p.id, olderThanDays);
        totalStale += stale;
        totalDeleted += deleted;
      }),
    );
    job.log(`Document cleanup complete: stale=${totalStale} hard-deleted=${totalDeleted}`);
  } else {
    job.log(`Document cleanup: practice=${practiceId} stale threshold=${olderThanDays}d`);
    const { stale, deleted } = await cleanupForPractice(practiceId, olderThanDays);
    job.log(`Document cleanup complete: stale=${stale} hard-deleted=${deleted}`);
  }
}
