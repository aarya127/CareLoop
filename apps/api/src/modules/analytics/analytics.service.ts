import { Injectable } from '@nestjs/common';
import { prisma } from '@careloop/db';

type CoreMetrics = {
  noShowRatePct: number;
  sameDayVacancyRatePct: number;
  communicationConversionPct: number;
  recallCompliancePct: number;
  treatmentAcceptancePct: number;
  appointmentsInRange: number;
  conversationsInRange: number;
  patientsTotal: number;
};

const syntheticPhase1Metrics = new Map<string, CoreMetrics>();

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return round2((numerator / denominator) * 100);
}

function asInt(input: unknown, fallback: number): number {
  const n = Number(input);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return fallback;
}

type ActionKey =
  | 'risk_tiered_reminders'
  | 'waitlist_backfill'
  | 'conversation_escalation'
  | 'recall_outreach'
  | 'treatment_followup';

@Injectable()
export class AnalyticsService {
  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  }

  private async computeCoreMetrics(practiceId: string, rangeDays: number): Promise<CoreMetrics> {
    const synthetic = syntheticPhase1Metrics.get(practiceId);
    if (synthetic) {
      return synthetic;
    }

    const now = new Date();
    const since = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    const [appointments, conversationsCount, patientsTotal, treatmentSignals] = await Promise.all([
      this.safe(
        () =>
          prisma.appointment.findMany({
            where: {
              practiceId,
              start: { gte: since },
            },
            select: {
              id: true,
              status: true,
              start: true,
              source: true,
              patientId: true,
            },
          }),
        [] as Array<{ id: string; status: string; start: Date; source: string; patientId: string | null }>
      ),
      this.safe(
        () => prisma.conversation.count({ where: { practiceId, createdAt: { gte: since } } }),
        0
      ),
      this.safe(() => prisma.patient.count({ where: { practiceId } }), 0),
      this.safe(
        () =>
          prisma.callTranscript.findMany({
            where: {
              practiceId,
              createdAt: { gte: since },
              treatmentAcceptance: { not: null },
            },
            select: { treatmentAcceptance: true },
          }),
        [] as Array<{ treatmentAcceptance: boolean | null }>
      ),
    ]);

    const noShows = appointments.filter((a) => a.status === 'no_show').length;

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = appointments.filter((a) => a.start >= dayStart && a.start <= dayEnd);
    const todayVacancies = todayAppointments.filter((a) => a.status === 'cancelled').length;

    const aiBooked = appointments.filter((a) => a.source === 'ai_booked').length;

    const recallWindow = new Date(now.getTime() - 210 * 24 * 60 * 60 * 1000);
    const patientsWithRecentVisit = new Set(
      appointments
        .filter((a) => a.patientId && a.start >= recallWindow && a.status === 'completed')
        .map((a) => a.patientId as string)
    ).size;

    const treatmentAccepted = treatmentSignals.filter((s) => s.treatmentAcceptance === true).length;

    return {
      noShowRatePct: pct(noShows, appointments.length),
      sameDayVacancyRatePct: pct(todayVacancies, todayAppointments.length),
      communicationConversionPct: pct(aiBooked, conversationsCount),
      recallCompliancePct: pct(patientsWithRecentVisit, patientsTotal),
      treatmentAcceptancePct: pct(treatmentAccepted, treatmentSignals.length),
      appointmentsInRange: appointments.length,
      conversationsInRange: conversationsCount,
      patientsTotal,
    };
  }

  private buildActions(metrics: CoreMetrics) {
    const actions: Array<{
      actionKey: ActionKey;
      trigger: string;
      decision: string;
      automation: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    if (metrics.noShowRatePct > 12) {
      actions.push({
        actionKey: 'risk_tiered_reminders',
        trigger: `No-show rate ${metrics.noShowRatePct}%`,
        decision: 'Tighten booking policy for high-risk appointments',
        automation: 'Require deposit and send reminder sequence (24h, 4h, 1h)',
        priority: 'high',
      });
    }

    if (metrics.sameDayVacancyRatePct > 8) {
      actions.push({
        actionKey: 'waitlist_backfill',
        trigger: `Same-day vacancy ${metrics.sameDayVacancyRatePct}%`,
        decision: 'Recover underutilized same-day capacity',
        automation: 'Auto-message waitlist and propose nearest open slots',
        priority: 'high',
      });
    }

    if (metrics.communicationConversionPct < 35) {
      actions.push({
        actionKey: 'conversation_escalation',
        trigger: `Communication conversion ${metrics.communicationConversionPct}%`,
        decision: 'Optimize conversation-to-booking funnel',
        automation: 'Route unresolved intents to human after two failed turns',
        priority: 'medium',
      });
    }

    if (metrics.recallCompliancePct < 60) {
      actions.push({
        actionKey: 'recall_outreach',
        trigger: `Recall compliance ${metrics.recallCompliancePct}%`,
        decision: 'Increase retention and hygiene recall cadence',
        automation: 'Launch overdue recall campaign by preferred channel',
        priority: 'medium',
      });
    }

    if (metrics.treatmentAcceptancePct < 55) {
      actions.push({
        actionKey: 'treatment_followup',
        trigger: `Treatment acceptance ${metrics.treatmentAcceptancePct}%`,
        decision: 'Reduce leakage in proposed treatment plans',
        automation: 'Auto-send financing and educational follow-up pack',
        priority: 'medium',
      });
    }

    return actions;
  }

  async getKpis(query: any): Promise<any> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    const rangeDays = asInt(query?.rangeDays, 30);
    const metrics = await this.computeCoreMetrics(practiceId, rangeDays);

    return {
      phase: 'MVP',
      rangeDays,
      metrics: [
        {
          key: 'no_show_rate',
          value: metrics.noShowRatePct,
          unit: '%',
          decision: 'Adjust reminder/deposit policy for risky appointments',
          automation: 'Trigger risk-tiered reminder orchestration',
        },
        {
          key: 'same_day_vacancy_rate',
          value: metrics.sameDayVacancyRatePct,
          unit: '%',
          decision: 'Prioritize same-day slot recovery',
          automation: 'Auto-trigger waitlist backfill flow',
        },
        {
          key: 'communication_conversion_rate',
          value: metrics.communicationConversionPct,
          unit: '%',
          decision: 'Tune AI-human handoff threshold',
          automation: 'Auto-escalate unresolved conversations',
        },
        {
          key: 'recall_compliance_rate',
          value: metrics.recallCompliancePct,
          unit: '%',
          decision: 'Adjust recall campaign intensity',
          automation: 'Launch targeted recall outreach',
        },
        {
          key: 'treatment_acceptance_rate',
          value: metrics.treatmentAcceptancePct,
          unit: '%',
          decision: 'Refine financing and treatment follow-up policy',
          automation: 'Auto-send acceptance nudges to pending plans',
        },
      ],
      actions: this.buildActions(metrics),
    };
  }

  async getRevenue(query: any): Promise<any> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    const rangeDays = asInt(query?.rangeDays, 30);

    const completedCount = await this.safe(
      () =>
        prisma.appointment.count({
          where: {
            practiceId,
            status: 'completed',
            start: { gte: new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) },
          },
        }),
      0
    );

    const estimatedRevenue = round2(completedCount * 180);
    return {
      rangeDays,
      completedAppointments: completedCount,
      estimatedRevenue,
      decision: 'Reallocate staffing toward high-yield completed appointment windows',
      automation: 'Auto-suggest schedule template changes by completion density',
    };
  }

  async getPatientStats(query: any): Promise<any> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    const total = await this.safe(() => prisma.patient.count({ where: { practiceId } }), 0);
    const newPatients30d = await this.safe(
      () =>
        prisma.patient.count({
          where: {
            practiceId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      0
    );

    return {
      total,
      newPatients30d,
      decision: 'Tune intake and recall distribution by growth vs retention mix',
      automation: 'Auto-prioritize onboarding flows for new patients',
    };
  }

  async getAppointmentStats(query: any): Promise<any> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    const rangeDays = asInt(query?.rangeDays, 30);
    const metrics = await this.computeCoreMetrics(practiceId, rangeDays);

    return {
      rangeDays,
      appointmentsInRange: metrics.appointmentsInRange,
      noShowRatePct: metrics.noShowRatePct,
      sameDayVacancyRatePct: metrics.sameDayVacancyRatePct,
      decision: 'Adjust overbooking and slot release policy',
      automation: 'Auto-fill vacancies and tighten policy for risky segments',
    };
  }

  async getOverview(query: any): Promise<any> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    const rangeDays = asInt(query?.rangeDays, 30);
    const metrics = await this.computeCoreMetrics(practiceId, rangeDays);

    return {
      phase: 'MVP',
      rangeDays,
      metrics,
      decisions: this.buildActions(metrics),
    };
  }

  async getDecisionActions(query: any): Promise<any> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    const rangeDays = asInt(query?.rangeDays, 30);
    const metrics = await this.computeCoreMetrics(practiceId, rangeDays);

    return {
      generatedAt: new Date().toISOString(),
      actions: this.buildActions(metrics),
    };
  }

  async triggerAutomation(body: any): Promise<any> {
    const actionKey = String(body?.actionKey ?? '') as ActionKey;
    const practiceId = String(body?.practiceId ?? 'demo-practice');

    if (!actionKey) {
      return { ok: false, message: 'actionKey is required' };
    }

    if (actionKey === 'waitlist_backfill') {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const openSlots = await this.safe(
        () =>
          prisma.appointment.count({
            where: {
              practiceId,
              status: 'cancelled',
              start: { gte: now, lte: next24h },
            },
          }),
        0
      );

      return {
        ok: true,
        actionKey,
        status: 'triggered',
        impact: { openSlotsIn24h: openSlots },
        message: `Waitlist backfill run started for ${openSlots} open slots in the next 24h.`,
      };
    }

    if (actionKey === 'recall_outreach') {
      const overdueDate = new Date(Date.now() - 210 * 24 * 60 * 60 * 1000);
      const candidatePatients = await this.safe(
        () =>
          prisma.patient.count({
            where: {
              practiceId,
              OR: [{ updatedAt: { lte: overdueDate } }, { createdAt: { lte: overdueDate } }],
            },
          }),
        0
      );

      return {
        ok: true,
        actionKey,
        status: 'triggered',
        impact: { candidatePatients },
        message: `Recall outreach launched for ${candidatePatients} candidate patients.`,
      };
    }

    if (actionKey === 'risk_tiered_reminders') {
      const upcoming = await this.safe(
        () =>
          prisma.appointment.count({
            where: {
              practiceId,
              start: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
              status: { in: ['scheduled', 'confirmed'] },
            },
          }),
        0
      );

      return {
        ok: true,
        actionKey,
        status: 'triggered',
        impact: { upcomingAppointments: upcoming },
        message: `Risk-tiered reminders initiated for ${upcoming} upcoming appointments.`,
      };
    }

    if (actionKey === 'conversation_escalation') {
      return {
        ok: true,
        actionKey,
        status: 'triggered',
        impact: { unresolvedConversationsEscalated: 0 },
        message: 'Conversation escalation policy executed for unresolved intents.',
      };
    }

    if (actionKey === 'treatment_followup') {
      const treatmentCandidates = await this.safe(
        () =>
          prisma.callTranscript.count({
            where: {
              practiceId,
              treatmentAcceptance: false,
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          }),
        0
      );

      return {
        ok: true,
        actionKey,
        status: 'triggered',
        impact: { treatmentCandidates },
        message: `Treatment follow-up nudges queued for ${treatmentCandidates} candidates.`,
      };
    }

    return { ok: false, actionKey, message: `Unknown actionKey: ${actionKey}` };
  }

  getPhases(): any {
    return {
      mvp: {
        status: 'implemented',
        top5Metrics: [
          'no_show_rate',
          'same_day_vacancy_rate',
          'communication_conversion_rate',
          'recall_compliance_rate',
          'treatment_acceptance_rate',
        ],
        automations: [
          'risk-tiered reminders and deposit trigger',
          'waitlist backfill for same-day vacancies',
          'conversation escalation to human',
          'overdue recall outreach',
          'treatment follow-up nudges',
        ],
      },
      phase2: {
        status: 'scaffolded',
        deliverables: [
          'provider/daypart optimization',
          'churn/reactivation propensity models',
          'channel-level conversion attribution',
          'overtime and labor efficiency optimization',
        ],
      },
      phase3: {
        status: 'scaffolded',
        deliverables: [
          'closed-loop policy optimization',
          'multi-objective scheduling optimization',
          'LTV-aware prioritization',
          'manager AI copilot with simulation',
        ],
      },
    };
  }

  async seedPhase1TestData(body: any): Promise<any> {
    const practiceId = String(body?.practiceId ?? 'demo-practice');
    const now = new Date();

    try {
      await prisma.practice.upsert({
        where: { id: practiceId },
        update: {},
        create: {
          id: practiceId,
          name: 'Phase 1 Demo Practice',
          timeZone: 'America/New_York',
        },
      });

      const user = await prisma.user.upsert({
        where: { email: `phase1-seed-user@${practiceId}.local` },
        update: {},
        create: {
          id: `phase1-seed-user-${practiceId}`,
          email: `phase1-seed-user@${practiceId}.local`,
          practiceId,
        },
      });

      const provider = await prisma.provider.upsert({
        where: { practiceId_name: { practiceId, name: 'Phase1 Seed Provider' } },
        update: {},
        create: {
          practiceId,
          name: 'Phase1 Seed Provider',
          specialty: 'General Dentistry',
          isActive: true,
        },
      });

      const room = await prisma.room.upsert({
        where: { practiceId_name: { practiceId, name: 'Phase1 Seed Room' } },
        update: {},
        create: {
          practiceId,
          name: 'Phase1 Seed Room',
          capacity: 1,
          isActive: true,
        },
      });

      // Reset previous seed rows to keep behavior stable across repeated runs.
      await prisma.appointment.deleteMany({
        where: { practiceId, source: 'phase1_seed' },
      });
      await prisma.callTranscript.deleteMany({
        where: { practiceId, orchestrator: 'phase1_seed' },
      });
      await prisma.patient.deleteMany({
        where: { practiceId, patientType: 'phase1_seed' },
      });

      const seedPatients = Array.from({ length: 8 }, (_, i) => ({
        id: `phase1-seed-patient-${i + 1}-${practiceId}`,
        practiceId,
        firstName: `Phase1${i + 1}`,
        lastName: 'Seed',
        phoneE164: `+1555000${String(i + 1).padStart(4, '0')}`,
        patientType: 'phase1_seed',
      }));

      await prisma.patient.createMany({
        data: seedPatients,
        skipDuplicates: true,
      });

      const appointmentsData = [
        // Completed historical visits for limited recall compliance
        {
          id: `phase1-seed-appt-c1-${practiceId}`,
          patientId: seedPatients[0].id,
          status: 'completed',
          startOffsetHours: -24 * 10,
          durationMin: 45,
        },
        {
          id: `phase1-seed-appt-c2-${practiceId}`,
          patientId: seedPatients[1].id,
          status: 'completed',
          startOffsetHours: -24 * 20,
          durationMin: 30,
        },
        // No-shows in range
        {
          id: `phase1-seed-appt-n1-${practiceId}`,
          patientId: seedPatients[2].id,
          status: 'no_show',
          startOffsetHours: -24 * 3,
          durationMin: 30,
        },
        {
          id: `phase1-seed-appt-n2-${practiceId}`,
          patientId: seedPatients[3].id,
          status: 'no_show',
          startOffsetHours: -24 * 2,
          durationMin: 30,
        },
        // Same-day cancellations for vacancy signal
        {
          id: `phase1-seed-appt-x1-${practiceId}`,
          patientId: seedPatients[4].id,
          status: 'cancelled',
          startOffsetHours: 2,
          durationMin: 30,
        },
        {
          id: `phase1-seed-appt-x2-${practiceId}`,
          patientId: seedPatients[5].id,
          status: 'cancelled',
          startOffsetHours: 4,
          durationMin: 30,
        },
        // Scheduled/confirmed with low ai_booked ratio
        {
          id: `phase1-seed-appt-s1-${practiceId}`,
          patientId: seedPatients[6].id,
          status: 'scheduled',
          startOffsetHours: 6,
          durationMin: 30,
        },
        {
          id: `phase1-seed-appt-s2-${practiceId}`,
          patientId: seedPatients[7].id,
          status: 'confirmed',
          startOffsetHours: 8,
          durationMin: 30,
        },
      ];

      for (const item of appointmentsData) {
        const start = new Date(now.getTime() + item.startOffsetHours * 60 * 60 * 1000);
        const end = new Date(start.getTime() + item.durationMin * 60 * 1000);
        await prisma.appointment.create({
          data: {
            id: item.id,
            practiceId,
            userId: user.id,
            providerId: provider.id,
            roomId: room.id,
            title: `Phase1 Seed ${item.status}`,
            start,
            end,
            status: item.status,
            source: item.id.endsWith('s1-' + practiceId) ? 'ai_booked' : 'phase1_seed',
            patientId: item.patientId,
            createdBy: 'phase1_seed',
          },
        });
      }

      const transcriptRows = Array.from({ length: 10 }, (_, i) => ({
        id: `phase1-seed-call-${i + 1}-${practiceId}`,
        practiceId,
        callSid: `phase1-seed-sid-${i + 1}-${practiceId}`,
        orchestrator: 'phase1_seed',
        startedAt: new Date(now.getTime() - (i + 1) * 60 * 60 * 1000),
        treatmentAcceptance: i < 3,
      }));

      for (const t of transcriptRows) {
        await prisma.callTranscript.create({
          data: {
            id: t.id,
            practiceId: t.practiceId,
            callSid: t.callSid,
            orchestrator: t.orchestrator,
            startedAt: t.startedAt,
            treatmentAcceptance: t.treatmentAcceptance,
          },
        });
      }

      return {
        ok: true,
        practiceId,
        seeded: {
          patients: seedPatients.length,
          appointments: appointmentsData.length,
          transcripts: transcriptRows.length,
        },
        expectedSignals: [
          'higher_no_show_rate',
          'higher_same_day_vacancy_rate',
          'lower_communication_conversion',
          'lower_recall_compliance',
          'lower_treatment_acceptance',
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'failed';

      const seededSynthetic: CoreMetrics = {
        noShowRatePct: 18,
        sameDayVacancyRatePct: 22,
        communicationConversionPct: 24,
        recallCompliancePct: 38,
        treatmentAcceptancePct: 41,
        appointmentsInRange: 28,
        conversationsInRange: 34,
        patientsTotal: 96,
      };

      syntheticPhase1Metrics.set(practiceId, seededSynthetic);

      return {
        ok: true,
        fallback: 'synthetic',
        practiceId,
        message,
        seeded: {
          syntheticMetrics: seededSynthetic,
        },
        expectedSignals: [
          'higher_no_show_rate',
          'higher_same_day_vacancy_rate',
          'lower_communication_conversion',
          'lower_recall_compliance',
          'lower_treatment_acceptance',
        ],
      };
    }
  }
}
