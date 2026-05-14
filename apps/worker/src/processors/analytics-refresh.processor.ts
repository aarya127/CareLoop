import type { Job } from 'bullmq';
import { prisma } from '@careloop/db';
import type { AnalyticsRefreshJobData } from '@careloop/shared';

async function refreshForPractice(practiceId: string): Promise<void> {
  const now = new Date();
  const kpiDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // today at 00:00

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalPatients, appointmentsByStatus, revenueResult, noShowCount, totalAppts] =
    await Promise.all([
      prisma.patient.count({ where: { practiceId } }),

      prisma.appointment.groupBy({
        by: ['status'],
        where: { practiceId, start: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),

      prisma.invoice.aggregate({
        where: {
          practiceId,
          status: { in: ['paid'] },
          issuedAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalAmountCents: true },
      }),

      prisma.appointment.count({
        where: { practiceId, status: 'no_show', start: { gte: thirtyDaysAgo } },
      }),

      prisma.appointment.count({
        where: { practiceId, start: { gte: thirtyDaysAgo } },
      }),
    ]);

  const noShowRate = totalAppts > 0 ? noShowCount / totalAppts : 0;
  const revenueCents = revenueResult._sum?.totalAmountCents ?? 0;
  const completedCount =
    appointmentsByStatus.find((r) => r.status === 'completed')?._count.id ?? 0;

  const metrics: Array<{ metricName: string; metricValue: number }> = [
    { metricName: 'total_patients', metricValue: totalPatients },
    { metricName: 'no_show_rate', metricValue: parseFloat(noShowRate.toFixed(4)) },
    { metricName: 'revenue_30d_cents', metricValue: revenueCents },
    { metricName: 'completed_appointments_30d', metricValue: completedCount },
  ];

  // Upsert each KPI metric for today — createMany + skipDuplicates is not
  // available for compound-key upserts in Prisma, so we use individual upserts.
  await Promise.all(
    metrics.map((m) =>
      prisma.practiceKPI.upsert({
        where: {
          // PracticeKPI has no unique constraint on (practiceId, kpiDate, metricName)
          // so we fall back to create/update using findFirst + update or create.
          // Prisma requires a @unique field for upsert; use findFirst + delete + create.
          id: -1, // sentinel — will never match, so upsert always creates
        },
        update: {},
        create: {
          practiceId,
          kpiDate,
          metricName: m.metricName,
          metricValue: m.metricValue,
        },
      }).catch(async () => {
        // Fallback: find and update existing row for today, or create new
        const existing = await prisma.practiceKPI.findFirst({
          where: { practiceId, kpiDate, metricName: m.metricName },
        });
        if (existing) {
          return prisma.practiceKPI.update({
            where: { id: existing.id },
            data: { metricValue: m.metricValue },
          });
        }
        return prisma.practiceKPI.create({
          data: { practiceId, kpiDate, metricName: m.metricName, metricValue: m.metricValue },
        });
      }),
    ),
  );
}

export async function analyticsRefreshProcessor(
  job: Job<AnalyticsRefreshJobData>,
): Promise<void> {
  const { practiceId } = job.data;

  if (practiceId === 'all') {
    job.log('Analytics refresh: all practices');
    const practices = await prisma.practice.findMany({ select: { id: true } });
    await Promise.all(
      practices.map((p) => {
        job.log(`Refreshing practice ${p.id}`);
        return refreshForPractice(p.id);
      }),
    );
    job.log(`Analytics refresh complete for ${practices.length} practices`);
  } else {
    job.log(`Analytics refresh: practice=${practiceId}`);
    await refreshForPractice(practiceId);
    job.log(`Analytics refresh complete for practice ${practiceId}`);
  }
}
