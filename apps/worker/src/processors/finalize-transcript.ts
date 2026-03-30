import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { FinalizeTranscriptJobData } from '@careloop/types';

export async function finalizeTranscriptProcessor(
  job: Job<FinalizeTranscriptJobData>
): Promise<void> {
  const { callSid, transcriptText } = job.data;
  job.log(`Finalizing transcript for call ${callSid}`);

  await prisma.callTranscript.updateMany({
    where: { callSid },
    data: {
      transcript: transcriptText,
      status: 'completed',
      processedAt: new Date(),
    },
  });

  job.log(`Transcript finalized for call ${callSid}`);
}
