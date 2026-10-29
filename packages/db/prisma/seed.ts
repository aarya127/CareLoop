/**
 * prisma/seed.ts — the private demo practice, "Maple Grove Dental (Demo)".
 *
 * Rebuilds ONLY the practice with id `demo-practice`: inside one transaction it
 * deletes every row that belongs to that practice and regenerates ~40 fictional
 * patients with six months of history and two weeks of upcoming appointments.
 * Safe to re-run; no other practice is ever read or written.
 *
 * Required environment:
 *   DATABASE_URL    target database
 *   DEMO_PASSWORD   password for demo@careloop.dev (12+ characters, keep it private)
 *   ENCRYPTION_KEY  the API's key — insurance identifiers are encrypted with it
 * Optional:
 *   DEMO_SEED       integer that varies the generated data (default 7351)
 *   BCRYPT_ROUNDS   bcrypt cost, defaults to the API's 12
 *
 * Run: pnpm --filter @careloop/db run db:seed
 */
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { DEMO_USERS } from './demo/catalog';
import {
  buildDemoDataset,
  DEMO_PRACTICE_ADDRESS,
  DEMO_PRACTICE_ID,
  DEMO_PRACTICE_NAME,
  DEMO_TIME_ZONE,
  type DemoDataset,
} from './demo/build';
import { resetDemoPractice } from './demo/reset';
import { encryptField, sha256Hex } from './field-crypto';

const CHUNK = 1_000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to seed the demo practice`);
  return value;
}

async function insertAll<T>(
  rows: T[],
  createMany: (args: { data: T[] }) => Promise<{ count: number }>,
): Promise<number> {
  let count = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    count += (await createMany({ data: rows.slice(i, i + CHUNK) })).count;
  }
  return count;
}

async function main() {
  const demoPassword = requireEnv('DEMO_PASSWORD');
  if (demoPassword.length < 12) throw new Error('DEMO_PASSWORD must be at least 12 characters');
  const encryptionKey = requireEnv('ENCRYPTION_KEY');
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const seed = Number(process.env.DEMO_SEED ?? 7351);
  const now = new Date();

  const prisma = new PrismaClient();
  try {
    // Refuse to reset a demo practice that real people have started using, or
    // to take over a demo email that belongs to another practice.
    const demoEmails = DEMO_USERS.map((u) => u.email);
    const existing = await prisma.user.findMany({
      where: { OR: [{ email: { in: demoEmails } }, { practiceId: DEMO_PRACTICE_ID }] },
      select: { id: true, email: true, practiceId: true },
    });
    const outsiders = existing.filter(
      (u) => u.practiceId === DEMO_PRACTICE_ID && !demoEmails.includes(u.email),
    );
    if (outsiders.length) {
      throw new Error(
        `${DEMO_PRACTICE_ID} has ${outsiders.length} non-demo user(s); refusing to reset it`,
      );
    }
    for (const u of existing) {
      const def = DEMO_USERS.find((d) => d.email === u.email);
      if (def && (u.practiceId !== DEMO_PRACTICE_ID || u.id !== def.id)) {
        throw new Error(
          `${u.email} exists outside the demo practice (or with another id); aborting`,
        );
      }
    }

    const passwordHash = await bcrypt.hash(demoPassword, rounds);
    const data: DemoDataset = buildDemoDataset({
      now,
      seed,
      encrypt: (plain) => encryptField(plain, encryptionKey),
      hashIdentifier: sha256Hex,
    });
    const demoUserIds = DEMO_USERS.map((u) => u.id);

    const counts = await prisma.$transaction(
      async (tx) => {
        await tx.practice.upsert({
          where: { id: DEMO_PRACTICE_ID },
          update: {
            name: DEMO_PRACTICE_NAME,
            address: DEMO_PRACTICE_ADDRESS,
            timeZone: DEMO_TIME_ZONE,
          },
          create: {
            id: DEMO_PRACTICE_ID,
            name: DEMO_PRACTICE_NAME,
            address: DEMO_PRACTICE_ADDRESS,
            timeZone: DEMO_TIME_ZONE,
          },
        });

        for (const u of DEMO_USERS) {
          const auth = {
            passwordHash: u.canSignIn ? passwordHash : null,
            passwordAlgo: 'bcrypt',
            status: 'active',
            failedLoginCount: 0,
            lockedUntil: null,
            deletedAt: null,
            deletedReason: null,
          };
          await tx.user.upsert({
            where: { email: u.email },
            update: { firstName: u.firstName, lastName: u.lastName, ...auth },
            create: {
              id: u.id,
              email: u.email,
              practiceId: DEMO_PRACTICE_ID,
              firstName: u.firstName,
              lastName: u.lastName,
              emailVerifiedAt: now,
              ...auth,
            },
          });
        }

        await resetDemoPractice(tx, demoUserIds);

        for (const u of DEMO_USERS) {
          const role = await tx.role.upsert({
            where: { name: u.role },
            update: {},
            create: { name: u.role, description: u.role },
          });
          await tx.userRole.create({
            data: { userId: u.id, roleId: role.id, assignedBy: 'user-dev' },
          });
        }

        // Anyone signed in with an old demo password is signed out.
        const revoked = await tx.session.updateMany({
          where: { userId: { in: demoUserIds }, revokedAt: null },
          data: { revokedAt: now, revokeReason: 'demo_reseed' },
        });

        // Insert in foreign-key order.
        const c: Record<string, number> = { sessionsRevoked: revoked.count };
        c.rooms = await insertAll(data.rooms, (a) => tx.room.createMany(a));
        c.providers = await insertAll(data.providers, (a) => tx.provider.createMany(a));
        c.schedules = await insertAll(data.schedules, (a) => tx.providerSchedule.createMany(a));
        c.blocks = await insertAll(data.blocks, (a) => tx.availabilityBlock.createMany(a));
        c.patients = await insertAll(data.patients, (a) => tx.patient.createMany(a));
        c.insurance = await insertAll(data.insurance, (a) => tx.patientInsurance.createMany(a));
        c.recordSections = await insertAll(data.recordSections, (a) =>
          tx.patientRecordSection.createMany(a),
        );
        c.medicalHistories = await insertAll(data.medicalHistories, (a) =>
          tx.patientMedicalHistory.createMany(a),
        );
        c.allergies = await insertAll(data.allergies, (a) => tx.allergy.createMany(a));
        c.medications = await insertAll(data.medications, (a) => tx.medication.createMany(a));
        c.conditions = await insertAll(data.conditions, (a) => tx.condition.createMany(a));
        c.appointments = await insertAll(data.appointments, (a) => tx.appointment.createMany(a));
        c.treatments = await insertAll(data.treatments, (a) => tx.treatmentRecord.createMany(a));
        c.invoices = await insertAll(data.invoices, (a) => tx.invoice.createMany(a));
        c.payments = await insertAll(data.payments, (a) => tx.paymentRecord.createMany(a));
        c.claims = await insertAll(data.claims, (a) => tx.claim.createMany(a));
        c.claimLines = await insertAll(data.claimLines, (a) => tx.claimLine.createMany(a));
        c.claimEvents = await insertAll(data.claimEvents, (a) => tx.claimStatusEvent.createMany(a));
        c.plans = await insertAll(data.plans, (a) => tx.treatmentPlan.createMany(a));
        c.planItems = await insertAll(data.planItems, (a) => tx.treatmentPlanItem.createMany(a));
        c.encounters = await insertAll(data.encounters, (a) => tx.encounter.createMany(a));
        c.toothChart = await insertAll(data.toothChart, (a) => tx.toothChartEntry.createMany(a));
        c.perioExams = await insertAll(data.perioExams, (a) => tx.periodontalExam.createMany(a));
        c.calls = await insertAll(data.transcripts, (a) => tx.callTranscript.createMany(a));
        c.segments = await insertAll(data.segments, (a) => tx.callTranscriptSegment.createMany(a));
        c.conversations = await insertAll(data.conversations, (a) => tx.conversation.createMany(a));
        c.participants = await insertAll(data.participants, (a) => tx.participant.createMany(a));
        c.messages = await insertAll(data.messages, (a) => tx.message.createMany(a));
        c.reminders = await insertAll(data.reminders, (a) => tx.reminder.createMany(a));
        c.kpis = await insertAll(data.kpis, (a) => tx.practiceKPI.createMany(a));

        await tx.aIPromptVersion.create({
          data: {
            practiceId: DEMO_PRACTICE_ID,
            version: 1,
            systemPrompt: `You are the virtual receptionist for ${DEMO_PRACTICE_NAME}. Be concise and professional. Never reveal protected health information to unverified callers.`,
            isActive: true,
            createdBy: 'user-dev',
          },
        });
        await tx.alertThreshold.create({
          data: {
            practiceId: DEMO_PRACTICE_ID,
            sentimentMin: 4,
            escalateOnTreatmentDecline: true,
            notifyChannel: { type: 'email', to: 'alerts@example.com' },
          },
        });
        await tx.routingPolicy.createMany({
          data: [
            { practiceId: DEMO_PRACTICE_ID, patientType: 'new', mode: 'ai_first' },
            { practiceId: DEMO_PRACTICE_ID, patientType: 'existing', mode: 'human_first' },
          ],
        });
        return c;
      },
      { maxWait: 30_000, timeout: 300_000 },
    );

    console.log(`✅  Demo practice rebuilt: ${DEMO_PRACTICE_NAME} (${DEMO_PRACTICE_ID})`);
    console.log(
      `    Sign in as demo@careloop.dev with DEMO_PASSWORD; other demo users cannot sign in.`,
    );
    for (const [name, n] of Object.entries(counts)) {
      console.log(`    ${name.padEnd(18)} ${n}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
