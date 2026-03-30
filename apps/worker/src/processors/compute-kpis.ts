import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { ComputeKpisJobData } from '@careloop/shared';

export async function computeKpisProcessor(
  job: Job<ComputeKpisJobData>
): Promise<void> {
  const { practiceId, date } = job.data;
  job.log(`Computing KPIs for practice ${practiceId} on ${date}`);

  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [totalPatients, totalAppointments] = await Promise.all([
    prisma.patient.count({ where: { practiceId } }),
    prisma.appointment.count({
      where: {
        practiceId,
        start: { gte: dayStart, lt: dayEnd },
      },
    }),
  ]);

  job.log(
    `KPIs: patients=${totalPatients} appointments=${totalAppointments}`
  );

  // TODO: persist KPI snapshot to a dedicated table
}
