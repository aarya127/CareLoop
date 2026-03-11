/**
 * prisma/seed.ts — CareLoop demo seed
 *
 * Fully idempotent: safe to run multiple times (uses upsert throughout).
 * Run via:  npm run db:seed
 * Prisma also calls this automatically on:  npm run db:reset
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── 1. Demo user ──────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'demo@careloop.dev' },
    update: {},
    create: {
      id: 'demo-user',
      email: 'demo@careloop.dev',
    },
  });

  // ── 2. Patients ───────────────────────────────────────────────────────────
  const patientDefs = [
    {
      id: 'patient-1',
      firstName: 'Alice',
      lastName: 'Johnson',
      dateOfBirth: new Date('1985-03-14'),
      phoneE164: '+14155551000',
      patientType: 'existing',
    },
    {
      id: 'patient-2',
      firstName: 'Bob',
      lastName: 'Martinez',
      dateOfBirth: new Date('1972-07-22'),
      phoneE164: '+14155551001',
      patientType: 'existing',
    },
    {
      id: 'patient-3',
      firstName: 'Carol',
      lastName: 'Smith',
      dateOfBirth: new Date('1993-11-05'),
      phoneE164: '+14155551002',
      patientType: 'new',
    },
  ];

  const patients = await Promise.all(
    patientDefs.map((p) =>
      prisma.patient.upsert({ where: { id: p.id }, update: {}, create: p })
    )
  );

  // ── 3. Patient insurance ──────────────────────────────────────────────────
  await prisma.patientInsurance.upsert({
    where: { id: 'ins-1' },
    update: {},
    create: {
      id: 'ins-1',
      patientId: 'patient-1',
      payerName: 'Delta Dental',
      planName: 'PPO Plus',
      memberIdEnc: 'DEMO_ENC_MEMBER_001',
      groupNumberEnc: 'DEMO_ENC_GROUP_001',
      coverageSummary: { preventive: '100%', basic: '80%', major: '50%', ortho: 'not covered' },
      active: true,
    },
  });

  await prisma.patientInsurance.upsert({
    where: { id: 'ins-2' },
    update: {},
    create: {
      id: 'ins-2',
      patientId: 'patient-2',
      payerName: 'Cigna Dental',
      planName: 'DPPO',
      memberIdEnc: 'DEMO_ENC_MEMBER_002',
      groupNumberEnc: 'DEMO_ENC_GROUP_002',
      coverageSummary: { preventive: '100%', basic: '70%', major: '50%' },
      active: true,
    },
  });

  // ── 4. Appointments ───────────────────────────────────────────────────────
  const now = new Date();
  const h = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

  const apptDefs = [
    {
      id: 'appt-1',
      userId: user.id,
      providerId: 'provider-1',
      title: 'Routine Exam: Alice Johnson',
      start: h(1),
      end: h(1.5),
      patientId: 'patient-1',
      procedureCode: 'D0120',
      status: 'confirmed',
      source: 'manual',
    },
    {
      id: 'appt-2',
      userId: user.id,
      providerId: 'provider-1',
      title: 'Crown Prep: Bob Martinez',
      start: h(3),
      end: h(4.5),
      patientId: 'patient-2',
      procedureCode: 'D2710',
      status: 'confirmed',
      source: 'ai_booked',
    },
    {
      id: 'appt-3',
      userId: user.id,
      providerId: 'provider-2',
      title: 'New Patient Exam: Carol Smith',
      start: h(6),
      end: h(7),
      patientId: 'patient-3',
      procedureCode: 'D0150',
      status: 'confirmed',
      source: 'ai_booked',
    },
  ];

  const appointments = await Promise.all(
    apptDefs.map((a) =>
      prisma.appointment.upsert({ where: { id: a.id }, update: {}, create: a })
    )
  );

  // ── 5. AI prompt version ──────────────────────────────────────────────────
  await prisma.aIPromptVersion.upsert({
    where: { practiceId_version: { practiceId: 'demo-practice', version: 1 } },
    update: {},
    create: {
      practiceId: 'demo-practice',
      version: 1,
      systemPrompt:
        'You are a helpful dental office AI assistant. Be concise, professional, and HIPAA-aware. Never reveal protected health information to unauthorized callers.',
      isActive: true,
      createdBy: user.id,
    },
  });

  // ── 6. Alert threshold ────────────────────────────────────────────────────
  await prisma.alertThreshold.upsert({
    where: { practiceId: 'demo-practice' },
    update: {},
    create: {
      practiceId: 'demo-practice',
      sentimentMin: 4,
      escalateOnTreatmentDecline: true,
      notifyChannel: { type: 'slack', webhookEnvVar: 'SLACK_WEBHOOK_URL' },
    },
  });

  // ── 7. Routing policies ───────────────────────────────────────────────────
  const policies = [
    { patientType: 'new', mode: 'ai_first' },
    { patientType: 'existing', mode: 'human_first' },
  ];

  await Promise.all(
    policies.map((p) =>
      prisma.routingPolicy.upsert({
        where: { practiceId_patientType: { practiceId: 'demo-practice', patientType: p.patientType } },
        update: {},
        create: { practiceId: 'demo-practice', ...p },
      })
    )
  );

  // ── 8. Practice KPIs (last 7 days, daily) ────────────────────────────────
  // PracticeKPI uses an auto-increment Int PK, so we guard with a count check
  // to keep the seed idempotent rather than using upsert.
  const existingKpiCount = await prisma.practiceKPI.count({
    where: { practiceId: 'demo-practice' },
  });

  let kpiRowCount = existingKpiCount;
  if (existingKpiCount === 0) {
    const kpiMetrics = [
      { metricName: 'scheduled_count', base: 12 },
      { metricName: 'no_show_rate', base: 0.08 },
      { metricName: 'treatment_acceptance_rate', base: 0.72 },
    ];
    const kpiRows: Parameters<typeof prisma.practiceKPI.createMany>[0]['data'] = [];
    for (let day = 6; day >= 0; day--) {
      const kpiDate = new Date(now);
      kpiDate.setDate(kpiDate.getDate() - day);
      kpiDate.setHours(0, 0, 0, 0);
      for (const m of kpiMetrics) {
        kpiRows.push({
          practiceId: 'demo-practice',
          kpiDate,
          metricName: m.metricName,
          // slight daily variation so charts look realistic
          metricValue: parseFloat((m.base * (0.9 + Math.random() * 0.2)).toFixed(4)),
          dimensions: { source: 'seed' },
        });
      }
    }
    const { count } = await prisma.practiceKPI.createMany({ data: kpiRows });
    kpiRowCount = count;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('✅  Seed complete');
  console.log(`    Users:        1  (${user.email})`);
  console.log(`    Patients:     ${patients.length}`);
  console.log(`    Appointments: ${appointments.length}`);
  console.log(`    KPI rows:     ${kpiRowCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
