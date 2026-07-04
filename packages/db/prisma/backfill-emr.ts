/**
 * One-time backfill: promote legacy clinical JSON into the new EMR tables.
 *
 * Sources (runtime-created JSONB tables, may not exist on all databases):
 *   - PatientMedicalHistory(patientId, history JSONB)  → Allergy / Medication / Condition
 *   - PatientRecordSectionsKv(patientId, section, payload JSONB)
 *       section 'clinicalChart'       → ToothChartEntry
 *       section 'periodontalRecords'  → PeriodontalExam
 *
 * Safe to re-run: for each patient it skips a target table that already has rows
 * (so it never duplicates). Best-effort and shape-tolerant — the legacy JSON is
 * unvalidated, so anything malformed is skipped, not fatal.
 *
 * Run: DATABASE_URL=... pnpm --filter @careloop/db exec tsx prisma/backfill-emr.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    `public."${name}"`,
  );
  return rows[0]?.exists ?? false;
}

async function practiceIdFor(patientId: string): Promise<string | null> {
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { practiceId: true },
  });
  return p?.practiceId ?? null;
}

let created = { allergies: 0, medications: 0, conditions: 0, teeth: 0, perio: 0 };

async function backfillMedicalHistory() {
  if (!(await tableExists('PatientMedicalHistory'))) {
    console.log('· PatientMedicalHistory table absent — skipping medical history');
    return;
  }
  const rows = await prisma.$queryRawUnsafe<{ patientId: string; history: any }[]>(
    `SELECT "patientId", history FROM public."PatientMedicalHistory"`,
  );
  for (const row of rows) {
    const practiceId = await practiceIdFor(row.patientId);
    if (!practiceId) continue;
    const h = row.history ?? {};

    if ((await prisma.allergy.count({ where: { patientId: row.patientId } })) === 0) {
      for (const a of h.allergies ?? []) {
        if (!a?.allergen) continue;
        await prisma.allergy.create({
          data: {
            practiceId,
            patientId: row.patientId,
            allergen: String(a.allergen),
            severity: ['mild', 'moderate', 'severe', 'life_threatening'].includes(a.severity)
              ? a.severity
              : 'moderate',
            reaction: a.reaction ?? null,
            status: 'active',
          },
        });
        created.allergies++;
      }
    }

    if ((await prisma.medication.count({ where: { patientId: row.patientId } })) === 0) {
      for (const m of h.current_medications ?? []) {
        if (!m?.name) continue;
        await prisma.medication.create({
          data: {
            practiceId,
            patientId: row.patientId,
            name: String(m.name),
            dosage: m.dosage ?? null,
            frequency: m.frequency ?? null,
            status: 'active',
            startDate: m.start_date ? new Date(m.start_date) : null,
            endDate: m.end_date ? new Date(m.end_date) : null,
            notes: m.purpose ?? m.notes ?? null,
          },
        });
        created.medications++;
      }
    }

    if ((await prisma.condition.count({ where: { patientId: row.patientId } })) === 0) {
      for (const c of h.systemic_conditions ?? []) {
        if (!c?.condition) continue;
        await prisma.condition.create({
          data: {
            practiceId,
            patientId: row.patientId,
            name: String(c.condition),
            status: c.status === 'resolved' ? 'resolved' : 'active',
            onsetDate: c.diagnosed_date ? new Date(c.diagnosed_date) : null,
            notes: c.treatment ?? c.notes ?? null,
          },
        });
        created.conditions++;
      }
    }
  }
}

async function backfillSections() {
  if (!(await tableExists('PatientRecordSectionsKv'))) {
    console.log('· PatientRecordSectionsKv table absent — skipping chart/perio');
    return;
  }
  const rows = await prisma.$queryRawUnsafe<{ patientId: string; section: string; payload: any }[]>(
    `SELECT "patientId", section, payload FROM public."PatientRecordSectionsKv"
     WHERE section IN ('clinicalChart', 'periodontalRecords')`,
  );
  for (const row of rows) {
    const practiceId = await practiceIdFor(row.patientId);
    if (!practiceId) continue;

    if (row.section === 'clinicalChart') {
      if ((await prisma.toothChartEntry.count({ where: { patientId: row.patientId } })) > 0) continue;
      const teeth = row.payload?.teeth ?? [];
      for (const tooth of teeth) {
        const n = Number(tooth?.tooth_number);
        if (!Number.isInteger(n) || n < 1 || n > 32) continue;
        const firstCond = (tooth.conditions ?? [])[0];
        await prisma.toothChartEntry.create({
          data: {
            practiceId,
            patientId: row.patientId,
            toothNumber: n,
            condition: String(firstCond?.type ?? tooth.status ?? 'unknown'),
            surfaces: Array.isArray(firstCond?.surfaces) ? firstCond.surfaces.map(String) : [],
            status: 'active',
          },
        });
        created.teeth++;
      }
    }

    if (row.section === 'periodontalRecords') {
      if ((await prisma.periodontalExam.count({ where: { patientId: row.patientId } })) > 0) continue;
      await prisma.periodontalExam.create({
        data: {
          practiceId,
          patientId: row.patientId,
          examDate: new Date(),
          measurements: row.payload ?? undefined,
          summary: 'Backfilled from legacy record section',
        },
      });
      created.perio++;
    }
  }
}

async function main() {
  console.log('EMR backfill starting…');
  await backfillMedicalHistory();
  await backfillSections();
  console.log('EMR backfill complete:', created);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
