import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { ComputeKpisJobData } from '@careloop/types';

export async function computeKpisProcessor(
  job: Job<ComputeKpisJobData>
): Promise<void> {
  const { practiceId, periodStart, periodEnd } = job.data;
  job.log(`Computing KPIs for practice ${practiceId} [${periodStart} → ${periodEnd}]`);

  const [totalPatients, totalAppointments] = await Promise.all([
    prisma.patient.count({ where: { practiceId } }),
    prisma.appointment.count({
      where: {
        practiceId,
        startTime: { gte: new Date(periodStart), lte: new Date(periodEnd) },
      },
    }),
  ]);

  job.log(
    `KPIs: patients=${totalPatients} appointments=${totalAppointments}`
  );

  // TODO: persist KPI snapshot to a dedicated table
}
