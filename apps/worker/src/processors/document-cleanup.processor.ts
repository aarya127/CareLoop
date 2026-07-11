import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { DocumentCleanupJobData } from '@careloop/shared';
import { deleteStorageObjects } from '../services/storage';

async function cleanupForPractice(
  practiceId: string,
  olderThanDays: number,
): Promise<{ stale: number; deleted: number }> {
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

  // Hard-delete DB rows soft-deleted for > 90 days. Remove the S3 objects first
  // (best-effort) so the bucket doesn't accumulate orphaned files.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const toDelete = await prisma.document.findMany({
    where: {
      practiceId,
      status: 'deleted',
      updatedAt: { lt: ninetyDaysAgo },
    },
    select: { id: true, storageKey: true },
  });

  await deleteStorageObjects(toDelete.map((d) => d.storageKey));

  const deletedResult = await prisma.document.deleteMany({
    where: { id: { in: toDelete.map((d) => d.id) } },
  });

  return { stale: staleResult.count, deleted: deletedResult.count };
}

export async function documentCleanupProcessor(job: Job<DocumentCleanupJobData>): Promise<void> {
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
