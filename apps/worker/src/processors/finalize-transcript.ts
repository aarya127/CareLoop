import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { FinalizeTranscriptJobData } from '@careloop/shared';

export async function finalizeTranscriptProcessor(
  job: Job<FinalizeTranscriptJobData>,
): Promise<void> {
  const { transcriptId, practiceId } = job.data;
  job.log(`Finalizing transcript ${transcriptId} for practice ${practiceId}`);

  await prisma.callTranscript.update({
    where: { id: transcriptId },
    data: {
      endedAt: new Date(),
    },
  });

  job.log(`Transcript ${transcriptId} finalized`);
}
