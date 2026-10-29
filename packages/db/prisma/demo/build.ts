// Builds the synthetic demo practice entirely in memory. Pure apart from the
// injected `encrypt`: no database access, no Math.random, and every date is
// relative to `now` so the demo always looks current.
//
// The story is generated patient-first: each patient gets an archetype
// (routine recall, restorative work, crown, periodontal, emergency, new,
// child, lapsed), which produces visit requests. Visits are placed on real
// provider calendars without double-booking, and each completed visit fans out
// into the records a real one leaves behind — clinical note, treatment
// records, tooth-chart changes, perio exam, invoice, payments, insurance
// claim, reminders and AI phone calls — so every page tells the same story.
import type { Prisma } from '@prisma/client';
import {
  ALLERGIES,
  callScript,
  CITIES,
  CONDITIONS,
  COVERAGE_TIERS,
  emailFor,
  FAMILY_CONDITIONS,
  FIRST_NAMES,
  INSURERS,
  LANGUAGES,
  LAST_NAMES,
  PROVIDERS,
  RELATIONSHIPS,
  ROOMS,
  soapFor,
  STREET_NAMES,
  STREET_TYPES,
  SURGERIES,
  VISIT_TYPES,
  type CallIntent,
  type ConditionDef,
  type CoverageCategory,
  type Gender,
  type ProviderDef,
  type VisitKey,
} from './catalog';
import { createRng } from './random';
import { addDays, addMinutes, atLocal, DAY_MS, isWeekday, localDateOf } from './time';

export const DEMO_PRACTICE_ID = 'demo-practice';
export const DEMO_PRACTICE_NAME = 'Maple Grove Dental (Demo)';
export const DEMO_PRACTICE_ADDRESS = '100 Example Avenue, Toronto, ON M5V 0A1';
export const DEMO_TIME_ZONE = 'America/Toronto';

const HISTORY_DAYS = 182;
const FUTURE_DAYS = 14;
const OPEN_MIN = 8 * 60;
const CLOSE_MIN = 17 * 60;
const LUNCH_START = 12 * 60;
const LUNCH_END = 13 * 60;
const SLOT_STEP_MIN = 30;
const HOUR_MS = 60 * 60 * 1000;

const POSTERIOR = [2, 3, 4, 5, 12, 13, 14, 15, 18, 19, 20, 21, 28, 29, 30, 31];
const MOLARS = [2, 3, 14, 15, 18, 19, 30, 31];
const THIRD_MOLARS = [1, 16, 17, 32];
/** Permanent teeth present in a 6–12 year old (first molars + incisors). */
const CHILD_TEETH = [3, 7, 8, 9, 10, 14, 19, 23, 24, 25, 26, 30];

const json = (value: unknown) => value as Prisma.InputJsonValue;
const pad = (n: number, width: number) => String(n).padStart(width, '0');
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BuildOptions {
  now: Date;
  seed: number;
  /** Encrypts insurance identifiers exactly like the API does. */
  encrypt: (plain: string) => string;
  hashIdentifier: (plain: string) => string;
}

export interface DemoDataset {
  rooms: Prisma.RoomCreateManyInput[];
  providers: Prisma.ProviderCreateManyInput[];
  schedules: Prisma.ProviderScheduleCreateManyInput[];
  blocks: Prisma.AvailabilityBlockCreateManyInput[];
  patients: Prisma.PatientCreateManyInput[];
  insurance: Prisma.PatientInsuranceCreateManyInput[];
  recordSections: Prisma.PatientRecordSectionCreateManyInput[];
  medicalHistories: Prisma.PatientMedicalHistoryCreateManyInput[];
  allergies: Prisma.AllergyCreateManyInput[];
  medications: Prisma.MedicationCreateManyInput[];
  conditions: Prisma.ConditionCreateManyInput[];
  appointments: Prisma.AppointmentCreateManyInput[];
  treatments: Prisma.TreatmentRecordCreateManyInput[];
  invoices: Prisma.InvoiceCreateManyInput[];
  payments: Prisma.PaymentRecordCreateManyInput[];
  claims: Prisma.ClaimCreateManyInput[];
  claimLines: Prisma.ClaimLineCreateManyInput[];
  claimEvents: Prisma.ClaimStatusEventCreateManyInput[];
  plans: Prisma.TreatmentPlanCreateManyInput[];
  planItems: Prisma.TreatmentPlanItemCreateManyInput[];
  encounters: Prisma.EncounterCreateManyInput[];
  toothChart: Prisma.ToothChartEntryCreateManyInput[];
  perioExams: Prisma.PeriodontalExamCreateManyInput[];
  transcripts: Prisma.CallTranscriptCreateManyInput[];
  segments: Prisma.CallTranscriptSegmentCreateManyInput[];
  conversations: Prisma.ConversationCreateManyInput[];
  participants: Prisma.ParticipantCreateManyInput[];
  messages: Prisma.MessageCreateManyInput[];
  reminders: Prisma.ReminderCreateManyInput[];
  kpis: Prisma.PracticeKPICreateManyInput[];
}

type Archetype =
  | 'routine'
  | 'restorative'
  | 'crown'
  | 'perio'
  | 'emergency'
  | 'new'
  | 'child'
  | 'lapsed';

type ToothStatus = 'healthy' | 'decayed' | 'filled' | 'crowned' | 'missing' | 'root_canal';

interface ToothState {
  status: ToothStatus;
  surfaces: string[];
  notes?: string;
  chartedAt: Date;
  entryStatus: 'active' | 'planned' | 'resolved';
  chartedBy: string;
}

interface DemoPatient {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: Date;
  age: number;
  archetype: Archetype;
  phone: string;
  email: string;
  createdAt: Date;
  createdOffset: number;
  insurance?: {
    id: string;
    payerName: string;
    planName: string;
    coverage: (typeof COVERAGE_TIERS)[number];
    memberId: string;
    groupNumber: string;
    deductibleCents: number;
  };
  anxious: boolean;
  perioStage: 'healthy' | 'gingivitis' | 'periodontitis';
  smoking: 'never' | 'former' | 'current';
  reminderMethod: 'sms' | 'email' | 'both';
  language: string;
  preferredDentist: ProviderDef;
  conditions: ConditionDef[];
  allergies: (typeof ALLERGIES)[number][];
  hasHistoryBlob: boolean;
  chart: Map<number, ToothState>;
  /** First completed exam — the whole mouth is charted from then on. */
  firstExamAt?: Date;
}

interface PlanItemState {
  row: Prisma.TreatmentPlanItemCreateManyInput;
  visit: VisitKey;
  tooth?: number;
}

interface PlanState {
  row: Prisma.TreatmentPlanCreateManyInput;
  items: PlanItemState[];
  decision: 'accepted' | 'declined' | 'pending';
  decidedAt?: Date;
}

interface VisitRequest {
  patient: DemoPatient;
  visit: VisitKey;
  target: number; // day offset from today
  minOffset: number;
  tooth?: number;
  source?: 'manual' | 'ai_booked' | 'rescheduled';
  bookedAfter?: Date;
  forceStatus?: 'cancelled';
  planItem?: PlanItemState;
  plan?: PlanState;
  /** Number of new carious teeth found if this visit completes. */
  findDecay?: number;
  /** Follow-up treatment to diagnose at this visit. */
  diagnose?: 'crown' | 'rct_crown' | 'emergency';
  /** Whether a plan diagnosed at this visit is accepted. */
  acceptChance?: number;
  rebooked?: boolean;
}

interface PlacedVisit {
  id: string;
  req: VisitRequest;
  provider: ProviderDef;
  offset: number;
  start: Date;
  end: Date;
  status: 'completed' | 'no_show' | 'cancelled' | 'confirmed' | 'pending';
  source: 'manual' | 'ai_booked' | 'rescheduled';
  bookedAt: Date;
  totalCents: number;
  insurerCents: number;
}

interface CallSignal {
  at: Date;
  sentiment: number;
  accepted: boolean | null;
}

function emptyDataset(): DemoDataset {
  return {
    rooms: [],
    providers: [],
    schedules: [],
    blocks: [],
    patients: [],
    insurance: [],
    recordSections: [],
    medicalHistories: [],
    allergies: [],
    medications: [],
    conditions: [],
    appointments: [],
    treatments: [],
    invoices: [],
    payments: [],
    claims: [],
    claimLines: [],
    claimEvents: [],
    plans: [],
    planItems: [],
    encounters: [],
    toothChart: [],
    perioExams: [],
    transcripts: [],
    segments: [],
    conversations: [],
    participants: [],
    messages: [],
    reminders: [],
    kpis: [],
  };
}

export function buildDemoDataset(opts: BuildOptions): DemoDataset {
  const { now } = opts;
  const rng = createRng(opts.seed);
  const out = emptyDataset();
  const P = DEMO_PRACTICE_ID;
  const TZ = DEMO_TIME_ZONE;
  const today = localDateOf(now, TZ);

  const counters = new Map<string, number>();
  const nextId = (kind: string) => {
    const n = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, n);
    return `demo-${kind}-${pad(n, 4)}`;
  };
  const nextRef = (prefix: string) => {
    const n = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, n);
    return `DEMO-${prefix}-${pad(n, 6)}`;
  };

  const dayAt = (offset: number) => addDays(today, offset);
  const at = (offset: number, minutes: number) => atLocal(dayAt(offset), minutes, TZ);
  const offsetOf = (d: Date) => {
    const ld = localDateOf(d, TZ);
    return Math.round(
      (Date.UTC(ld.y, ld.m - 1, ld.d) - Date.UTC(today.y, today.m - 1, today.d)) / DAY_MS,
    );
  };
  const minDate = (a: Date, b: Date) => (a < b ? a : b);
  const maxDate = (a: Date, b: Date) => (a > b ? a : b);
  const between = (from: Date, to: Date) =>
    to <= from ? from : new Date(from.getTime() + rng.next() * (to.getTime() - from.getTime()));
  const fmtWhen = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);

  const dentists = PROVIDERS.filter((p) => p.kind === 'dentist');
  const hygienist = PROVIDERS.find((p) => p.kind === 'hygienist')!;

  // ── Providers, rooms, schedules, blocks ─────────────────────────────────────
  out.rooms = ROOMS.map((r) => ({ id: r.id, practiceId: P, name: r.name, capacity: 1 }));
  out.providers = PROVIDERS.map((p) => ({
    id: p.id,
    practiceId: P,
    name: p.name,
    specialty: p.specialty,
    license: p.license,
    isActive: true,
  }));
  for (const p of PROVIDERS) {
    for (let dow = 1; dow <= 5; dow++) {
      for (const [startMin, endMin] of [
        [OPEN_MIN, LUNCH_START],
        [LUNCH_END, CLOSE_MIN],
      ]) {
        out.schedules.push({
          id: nextId('sched'),
          practiceId: P,
          providerId: p.id,
          dayOfWeek: dow,
          startMin,
          endMin,
        });
      }
    }
  }

  const firstWeekdayFrom = (offset: number) => {
    let o = offset;
    while (!isWeekday(dayAt(o))) o++;
    return o;
  };
  const blocks: Array<{
    providerId: string | null;
    offset: number;
    startMin: number;
    endMin: number;
    reason: string;
  }> = [
    {
      providerId: 'demo-prov-okonkwo',
      offset: firstWeekdayFrom(8),
      startMin: OPEN_MIN,
      endMin: CLOSE_MIN,
      reason: 'Continuing education course',
    },
    {
      providerId: null,
      offset: firstWeekdayFrom(-60),
      startMin: LUNCH_END,
      endMin: CLOSE_MIN,
      reason: 'Staff training — CPR recertification',
    },
  ];
  for (const b of blocks) {
    out.blocks.push({
      id: nextId('block'),
      practiceId: P,
      providerId: b.providerId,
      start: at(b.offset, b.startMin),
      end: at(b.offset, b.endMin),
      reason: b.reason,
      source: 'manual',
    });
  }

  // ── Patients ────────────────────────────────────────────────────────────────
  const archetypeMix: Archetype[] = [
    ...Array<Archetype>(8).fill('routine'),
    ...Array<Archetype>(8).fill('restorative'),
    ...Array<Archetype>(4).fill('crown'),
    ...Array<Archetype>(4).fill('perio'),
    ...Array<Archetype>(4).fill('emergency'),
    ...Array<Archetype>(5).fill('new'),
    ...Array<Archetype>(5).fill('child'),
    ...Array<Archetype>(2).fill('lapsed'),
  ];
  const archetypes = rng.shuffle(archetypeMix);
  const firstNames = rng.shuffle(FIRST_NAMES);
  const lastNames = rng.shuffle(LAST_NAMES);

  const ageOn = (dob: Date) => {
    const ld = localDateOf(now, TZ);
    let age = ld.y - dob.getUTCFullYear();
    if (
      ld.m - 1 < dob.getUTCMonth() ||
      (ld.m - 1 === dob.getUTCMonth() && ld.d < dob.getUTCDate())
    ) {
      age -= 1;
    }
    return age;
  };

  const patients: DemoPatient[] = archetypes.map((archetype, i) => {
    const [firstName, gender] = firstNames[i];
    const lastName = lastNames[i];
    const targetAge =
      archetype === 'child'
        ? rng.int(6, 12)
        : archetype === 'perio'
          ? rng.int(42, 74)
          : archetype === 'crown'
            ? rng.int(36, 78)
            : rng.weighted([
                [rng.int(19, 34), 3],
                [rng.int(35, 54), 4],
                [rng.int(55, 84), 3],
              ] as const);
    const dob = new Date(Date.UTC(today.y - targetAge, rng.int(0, 11), rng.int(1, 28)));
    const age = ageOn(dob);
    const createdOffset = archetype === 'new' ? -rng.int(3, 26) : -rng.int(220, 1500);
    const createdAt = at(createdOffset, rng.int(9 * 60, 16 * 60));
    const id = `demo-pt-${pad(i + 1, 2)}`;

    const insured = rng.chance(archetype === 'new' ? 0.6 : 0.72);
    const insurer = rng.pick(INSURERS);
    const insurance = insured
      ? {
          id: `demo-ins-${pad(i + 1, 2)}`,
          payerName: insurer.payerName,
          planName: rng.pick(insurer.plans),
          coverage: rng.pick(COVERAGE_TIERS),
          memberId: `DEMO${rng.int(10_000_000, 99_999_999)}`,
          groupNumber: `G-${rng.int(10_000, 99_999)}`,
          deductibleCents: rng.pick([0, 0, 2_500, 5_000]),
        }
      : undefined;

    const eligible = CONDITIONS.filter((c) => age >= c.minAge);
    const conditionCount =
      archetype === 'child'
        ? rng.chance(0.25)
          ? 1
          : 0
        : rng.weighted([
            [0, 5],
            [1, 3],
            [2, 2],
          ] as const) + (age >= 60 && rng.chance(0.5) ? 1 : 0);
    const allergyCount = rng.weighted([
      [0, 15],
      [1, 4],
      [2, 1],
    ] as const);
    const allergies: (typeof ALLERGIES)[number][] = [];
    while (allergies.length < allergyCount) {
      const a = rng.weighted(ALLERGIES.map((x) => [x, x.weight] as const));
      if (!allergies.includes(a)) allergies.push(a);
    }

    const patient: DemoPatient = {
      id,
      firstName,
      lastName,
      gender,
      dob,
      age,
      archetype,
      // 555-0100 … 555-0199 is reserved for fictional use.
      phone: `+1416555${pad(100 + i, 4)}`,
      email: emailFor(firstName, lastName),
      createdAt,
      createdOffset,
      insurance,
      anxious: rng.chance(0.15),
      perioStage:
        archetype === 'perio' ? 'periodontitis' : rng.chance(0.25) ? 'gingivitis' : 'healthy',
      smoking:
        archetype === 'child'
          ? 'never'
          : rng.weighted([
              ['never', 7],
              ['former', 2],
              ['current', archetype === 'perio' ? 3 : 1],
            ] as const),
      reminderMethod: rng.weighted([
        ['sms', 5],
        ['email', 3],
        ['both', 2],
      ] as const),
      language: rng.weighted(LANGUAGES),
      preferredDentist: rng.weighted([
        [dentists[0], 3],
        [dentists[1], 2],
      ] as const),
      conditions: rng.sample(eligible, conditionCount),
      allergies,
      hasHistoryBlob: i % 2 === 0,
      chart: new Map(),
    };

    // Baseline dentition from before the patient joined the practice.
    if (archetype !== 'child') {
      const chartedBy = 'user-doctor';
      for (const t of THIRD_MOLARS) {
        if (rng.chance(0.55)) {
          patient.chart.set(t, {
            status: 'missing',
            surfaces: [],
            notes: 'Extracted before joining the practice',
            chartedAt: createdAt,
            entryStatus: 'resolved',
            chartedBy,
          });
        }
      }
      for (const t of rng.sample(POSTERIOR, rng.int(0, age > 40 ? 5 : 3))) {
        if (patient.chart.has(t)) continue;
        patient.chart.set(t, {
          status: 'filled',
          surfaces: rng.sample(['occlusal', 'mesial', 'distal'], rng.int(1, 2)),
          notes: 'Existing restoration',
          chartedAt: createdAt,
          entryStatus: 'resolved',
          chartedBy,
        });
      }
      const openMolars = MOLARS.filter((m) => !patient.chart.has(m));
      if (age > 35 && openMolars.length && rng.chance(0.2)) {
        const t = rng.pick(openMolars);
        patient.chart.set(t, {
          status: 'crowned',
          surfaces: [],
          notes: rng.chance(0.5) ? 'Root canal treated, ceramic crown' : 'Ceramic crown',
          chartedAt: createdAt,
          entryStatus: 'resolved',
          chartedBy,
        });
      }
    }
    return patient;
  });

  /** A tooth that can develop new decay (present, not crowned/decayed/treated). */
  const freshTooth = (p: DemoPatient, pool = POSTERIOR): number | undefined => {
    const teeth = p.archetype === 'child' ? CHILD_TEETH.filter((t) => MOLARS.includes(t)) : pool;
    const options = teeth.filter((t) => {
      const s = p.chart.get(t)?.status;
      return s === undefined || s === 'healthy' || s === 'filled';
    });
    return options.length ? rng.pick(options) : undefined;
  };

  for (const p of patients) {
    out.patients.push({
      id: p.id,
      practiceId: P,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dob,
      phoneE164: p.phone,
      gender: p.gender,
      patientType: p.archetype === 'new' ? 'new' : 'existing',
      ...(rng.chance(0.6)
        ? {
            emergencyContactName: `${rng.pick(FIRST_NAMES)[0]} ${rng.chance(0.6) ? p.lastName : rng.pick(LAST_NAMES)}`,
            emergencyContactRelationship:
              p.archetype === 'child' ? 'Parent' : rng.pick(RELATIONSHIPS),
            emergencyContactPhone: `+1647555${pad(100 + patients.indexOf(p), 4)}`,
          }
        : {}),
      createdAt: p.createdAt,
    });

    out.recordSections.push({
      patientId: p.id,
      section: 'profile',
      payload: json({
        contact: {
          email: p.email,
          phone: '',
          address: {
            street: `${rng.int(12, 980)} ${rng.pick(STREET_NAMES)} ${rng.pick(STREET_TYPES)}`,
            city: rng.pick(CITIES),
            state: 'ON',
            postal_code: `M${rng.int(1, 9)}${String.fromCharCode(65 + rng.int(0, 25))} ${rng.int(1, 9)}${String.fromCharCode(65 + rng.int(0, 25))}${rng.int(1, 9)}`,
            country: 'Canada',
          },
        },
        preferences: {
          preferred_dentist_id: p.preferredDentist.id,
          preferred_dentist_name: p.preferredDentist.name,
          preferred_hygienist_id: hygienist.id,
          preferred_hygienist_name: hygienist.name,
          appointment_reminder_method: p.reminderMethod,
          communication_language: p.language,
        },
      }),
      createdAt: p.createdAt,
    });

    for (const a of p.allergies) {
      out.allergies.push({
        id: nextId('allergy'),
        practiceId: P,
        patientId: p.id,
        allergen: a.allergen,
        severity: a.severity,
        reaction: a.reaction,
        status: 'active',
        recordedBy: 'user-doctor',
        notedAt: p.createdAt,
        createdAt: p.createdAt,
      });
    }
    for (const c of p.conditions) {
      const yearsAgo = rng.int(1, Math.max(1, Math.min(15, p.age - c.minAge + 1)));
      const onset = new Date(p.createdAt.getTime() - yearsAgo * 365 * DAY_MS);
      out.conditions.push({
        id: nextId('condition'),
        practiceId: P,
        patientId: p.id,
        name: c.name,
        code: c.code,
        status: c.status,
        onsetDate: onset,
        notes: c.dentalNote ?? null,
        recordedBy: 'user-doctor',
        createdAt: p.createdAt,
      });
      if (c.medication) {
        out.medications.push({
          id: nextId('med'),
          practiceId: P,
          patientId: p.id,
          name: c.medication.name,
          dosage: c.medication.dosage,
          frequency: c.medication.frequency,
          route: c.medication.route,
          status: 'active',
          startDate: new Date(onset.getTime() + rng.int(7, 120) * DAY_MS),
          prescribedBy: 'Family physician',
          notes: `For ${c.name.toLowerCase()}`,
          createdAt: p.createdAt,
        });
      }
    }
  }

  // ── Scheduling ──────────────────────────────────────────────────────────────
  const occupied = new Map<string, Array<[number, number]>>(); // `${providerId}|${offset}`
  const patientDays = new Set<string>(); // `${patientId}|${offset}`
  const blocked = (providerId: string, offset: number, s: number, e: number) =>
    blocks.some(
      (b) =>
        (b.providerId === null || b.providerId === providerId) &&
        b.offset === offset &&
        s < b.endMin &&
        e > b.startMin,
    );

  const findSlot = (provider: ProviderDef, offset: number, minutes: number, notBefore?: Date) => {
    const taken = occupied.get(`${provider.id}|${offset}`) ?? [];
    const free: number[] = [];
    for (let s = OPEN_MIN; s + minutes <= CLOSE_MIN; s += SLOT_STEP_MIN) {
      const e = s + minutes;
      if (s < LUNCH_END && e > LUNCH_START) continue;
      if (taken.some(([ts, te]) => s < te && e > ts)) continue;
      if (blocked(provider.id, offset, s, e)) continue;
      if (notBefore && at(offset, s) <= notBefore) continue;
      free.push(s);
    }
    return free.length ? rng.pick(free) : undefined;
  };

  const place = (req: VisitRequest) => {
    const type = VISIT_TYPES[req.visit];
    const candidates =
      type.kind === 'hygienist'
        ? [hygienist]
        : [
            req.patient.preferredDentist,
            ...dentists.filter((d) => d !== req.patient.preferredDentist),
          ];
    for (const shift of [0, 1, -1, 2, -2, 3, -3, 4, 5, 6, 7]) {
      const offset = req.target + shift;
      if (offset < req.minOffset || offset < -HISTORY_DAYS || offset > FUTURE_DAYS) continue;
      if (offset < req.patient.createdOffset) continue;
      if (!isWeekday(dayAt(offset))) continue;
      if (patientDays.has(`${req.patient.id}|${offset}`)) continue;
      for (const provider of candidates) {
        const startMin = findSlot(provider, offset, type.minutes, req.bookedAfter);
        if (startMin === undefined) continue;
        const key = `${provider.id}|${offset}`;
        occupied.set(key, [...(occupied.get(key) ?? []), [startMin, startMin + type.minutes]]);
        patientDays.add(`${req.patient.id}|${offset}`);
        return {
          provider,
          offset,
          start: at(offset, startMin),
          end: at(offset, startMin + type.minutes),
        };
      }
    }
    return undefined;
  };

  // ── Visit requests per archetype ────────────────────────────────────────────
  const queue: VisitRequest[] = [];
  const enqueue = (req: VisitRequest) => {
    if (req.target > FUTURE_DAYS + 3) return; // beyond the visible window — not booked yet
    queue.push(req);
  };

  for (const p of patients) {
    // ~55% of recall patients are due in the next two weeks, which keeps the
    // upcoming calendar realistically full.
    const dueSoon = rng.chance(0.55);
    const nextRecall = dueSoon ? rng.int(0, FUTURE_DAYS) : rng.int(15, 170);
    const recallVisit: VisitKey = p.archetype === 'child' ? 'child_recall' : 'recall';
    const base = { patient: p, minOffset: -HISTORY_DAYS };

    switch (p.archetype) {
      case 'routine':
      case 'child':
        enqueue({
          ...base,
          visit: recallVisit,
          target: nextRecall - 182,
          findDecay: rng.chance(0.15) ? 1 : 0,
          acceptChance: 0.7,
        });
        enqueue({ ...base, visit: recallVisit, target: nextRecall });
        break;
      case 'restorative':
        enqueue({
          ...base,
          visit: 'recall',
          target: nextRecall - 182,
          findDecay: rng.int(1, 2),
          acceptChance: 0.75,
        });
        enqueue({ ...base, visit: 'recall', target: nextRecall });
        break;
      case 'crown':
        enqueue({
          ...base,
          visit: 'recall',
          target: nextRecall - 182,
          diagnose: rng.chance(0.3) ? 'rct_crown' : 'crown',
          acceptChance: 0.85,
        });
        enqueue({ ...base, visit: 'recall', target: nextRecall });
        break;
      case 'perio': {
        const srp = dueSoon ? rng.int(-182, -168) : rng.int(-165, -100);
        enqueue({ ...base, visit: 'srp', target: srp });
        for (let o = srp + 91; o <= FUTURE_DAYS; o += 91) {
          enqueue({ ...base, visit: 'perio_maint', target: o });
        }
        break;
      }
      case 'emergency':
        enqueue({ ...base, visit: 'recall', target: nextRecall - 182 });
        enqueue({ ...base, visit: 'recall', target: nextRecall });
        enqueue({ ...base, visit: 'emergency', target: rng.int(-150, -5), diagnose: 'emergency' });
        break;
      case 'new':
        enqueue({
          ...base,
          visit: 'new_patient',
          target: p.createdOffset + rng.int(2, 20),
          minOffset: p.createdOffset + 1,
          bookedAfter: p.createdAt,
          findDecay: rng.chance(0.6) ? rng.int(1, 2) : 0,
          acceptChance: 0.5,
        });
        break;
      case 'lapsed':
        // Booked a recall, then cancelled and never rebooked — overdue for recall.
        enqueue({ ...base, visit: 'recall', target: rng.int(-120, -40), forceStatus: 'cancelled' });
        break;
    }
  }

  // ── Plans, billing, calls (shared state) ────────────────────────────────────
  const plans: PlanState[] = [];
  const placed: PlacedVisit[] = [];
  const callSignals: CallSignal[] = [];
  const crownRecordByTooth = new Map<string, Prisma.TreatmentRecordCreateManyInput>();
  const completedPaymentsByDay: Array<{ at: Date; cents: number }> = [];

  const coveragePct = (p: DemoPatient, category: CoverageCategory) => {
    if (!p.insurance) return 0;
    const c = p.insurance.coverage;
    return category === 'preventive'
      ? c.preventivePct
      : category === 'basic'
        ? c.basicPct
        : c.majorPct;
  };

  const feeLinesFor = (visit: VisitKey) => VISIT_TYPES[visit].lines;
  const lineTotal = (l: { feeCents: number; qty?: number }) => l.feeCents * (l.qty ?? 1);

  const chartSet = (
    p: DemoPatient,
    tooth: number,
    state: Omit<ToothState, 'chartedBy'>,
    by: string,
  ) => {
    p.chart.set(tooth, { ...state, chartedBy: by });
  };

  const addCall = (args: {
    patient: DemoPatient;
    intent: CallIntent;
    at: Date;
    appointmentId?: string;
    visitLabel?: string;
    when?: Date;
    accepted?: boolean;
  }) => {
    if (args.at > now) return;
    const lines = callScript(args.intent, {
      firstName: args.patient.firstName,
      visitLabel: args.visitLabel,
      when: args.when ? fmtWhen(args.when) : undefined,
      accepted: args.accepted,
    });
    const sentiment = round2(
      args.intent === 'treatment_followup'
        ? args.accepted
          ? 7.8 + rng.next() * 1.6
          : 4.2 + rng.next() * 2
        : args.intent === 'billing'
          ? 5.5 + rng.next() * 1.7
          : args.intent === 'emergency'
            ? 5.6 + rng.next() * 1.9
            : 7.2 + rng.next() * 2.4,
    );
    const treatmentAcceptance =
      args.intent === 'treatment_followup' ? Boolean(args.accepted) : null;
    const transcriptId = nextId('call');
    const conversationId = nextId('conv');
    const handoff = lines.some((l) => l.speaker === 'staff');
    const endedAt = new Date(args.at.getTime() + rng.int(70, 260) * 1000);
    const step = (endedAt.getTime() - args.at.getTime()) / lines.length;

    out.transcripts.push({
      id: transcriptId,
      practiceId: P,
      patientId: args.patient.id,
      appointmentId: args.appointmentId ?? null,
      callSid: nextRef('CA'),
      orchestrator: 'demo',
      startedAt: args.at,
      endedAt,
      fullTranscript: lines
        .map(
          (l) =>
            `${l.speaker === 'ai' ? 'Assistant' : l.speaker === 'staff' ? 'Staff' : 'Patient'}: ${l.text}`,
        )
        .join('\n'),
      sentimentScore: sentiment,
      treatmentAcceptance,
      handoffOccurred: handoff,
      createdAt: args.at,
    });
    out.conversations.push({
      id: conversationId,
      practiceId: P,
      createdAt: args.at,
      updatedAt: endedAt,
    });
    out.participants.push({
      id: nextId('part'),
      conversationId,
      patientId: args.patient.id,
      joinedAt: args.at,
    });
    if (handoff) {
      out.participants.push({
        id: nextId('part'),
        conversationId,
        userId: 'user-receptionist',
        joinedAt: args.at,
      });
    }
    lines.forEach((line, idx) => {
      const segStart = new Date(args.at.getTime() + idx * step);
      const segEnd = new Date(segStart.getTime() + step * 0.9);
      out.segments.push({
        transcriptId,
        speaker: line.speaker,
        text: line.text,
        startedAt: segStart,
        endedAt: segEnd,
        confidence: round2(0.9 + rng.next() * 0.09),
      });
      out.messages.push({
        id: nextId('msg'),
        conversationId,
        senderId:
          line.speaker === 'patient'
            ? args.patient.id
            : line.speaker === 'staff'
              ? 'user-receptionist'
              : 'ai-assistant',
        content: line.text,
        sentAt: segStart,
      });
    });
    callSignals.push({ at: args.at, sentiment, accepted: treatmentAcceptance });
  };

  const createPlan = (args: {
    patient: DemoPatient;
    provider: ProviderDef;
    diagnosedAt: Date;
    title: string;
    items: Array<{ visit: VisitKey; tooth?: number }>;
    acceptChance: number;
  }): PlanState => {
    const p = args.patient;
    const planId = nextId('plan');
    const decidedAt = new Date(
      args.diagnosedAt.getTime() + rng.int(0, 3) * DAY_MS + rng.int(1, 6) * HOUR_MS,
    );
    // Recent diagnoses are often still awaiting the patient's decision.
    const recent = now.getTime() - args.diagnosedAt.getTime() < 21 * DAY_MS;
    const decision: PlanState['decision'] =
      decidedAt > now || (recent && rng.chance(0.6))
        ? 'pending'
        : rng.chance(args.acceptChance)
          ? 'accepted'
          : 'declined';
    const items: PlanItemState[] = args.items.map((it, idx) => {
      const lines = feeLinesFor(it.visit);
      const fee = sum(lines.map(lineTotal));
      return {
        visit: it.visit,
        tooth: it.tooth,
        row: {
          id: `${planId}-item-${idx + 1}`,
          planId,
          toothNumber: it.tooth ?? null,
          surface: it.visit === 'filling' ? 'MO' : null,
          procedureCode: lines[0]?.code ?? null,
          description: `${VISIT_TYPES[it.visit].label}${it.tooth ? ` — #${it.tooth}` : ''}`,
          feeCents: fee,
          status: 'planned',
          sortOrder: idx,
          createdAt: args.diagnosedAt,
        },
      };
    });
    const estimated = sum(items.map((i) => i.row.feeCents ?? 0));
    const insuranceEstimate = sum(
      args.items.flatMap((it) =>
        feeLinesFor(it.visit).map((l) =>
          Math.round((lineTotal(l) * coveragePct(p, l.category)) / 100),
        ),
      ),
    );
    const plan: PlanState = {
      decision,
      decidedAt: decision === 'pending' ? undefined : decidedAt,
      items,
      row: {
        id: planId,
        practiceId: P,
        patientId: p.id,
        providerId: args.provider.id,
        title: args.title,
        status: 'proposed',
        estimatedCostCents: estimated,
        insuranceEstimateCents: insuranceEstimate,
        createdBy: args.provider.userId,
        createdAt: args.diagnosedAt,
      },
    };
    plans.push(plan);
    if (decision !== 'pending' && rng.chance(0.6)) {
      addCall({
        patient: p,
        intent: 'treatment_followup',
        at: decidedAt,
        accepted: decision === 'accepted',
      });
    }
    return plan;
  };

  /** Book the plan's items in order, each a few days/weeks after the previous. */
  const schedulePlan = (
    plan: PlanState,
    fromOffset: number,
    fromTime: Date,
    firstGap: [number, number],
  ) => {
    if (plan.decision !== 'accepted') return;
    const [item, ...rest] = plan.items;
    if (!item) return;
    const offset = fromOffset + rng.int(firstGap[0], firstGap[1]);
    enqueue({
      patient: patients.find((p) => p.id === plan.row.patientId)!,
      visit: item.visit,
      tooth: item.tooth,
      target: offset,
      minOffset: fromOffset + 1,
      bookedAfter: plan.decidedAt ?? fromTime,
      source: 'manual',
      planItem: item,
      plan: { ...plan, items: rest } as PlanState,
    });
  };

  // ── Process visits in date order ────────────────────────────────────────────
  while (queue.length) {
    queue.sort((a, b) => a.target - b.target);
    const req = queue.shift()!;
    const slot = place(req);
    if (!slot) continue;

    const p = req.patient;
    const type = VISIT_TYPES[req.visit];
    const isPast = slot.end <= now;
    const inProgress = slot.start <= now && now < slot.end;

    let status: PlacedVisit['status'];
    if (isPast) {
      status =
        req.forceStatus ??
        (req.visit === 'emergency' || req.visit === 'crown_seat' || slot.offset === 0
          ? 'completed'
          : rng.weighted([
              ['completed', 85],
              ['no_show', 7],
              ['cancelled', 8],
            ] as const));
    } else if (inProgress) {
      status = 'confirmed';
    } else {
      status =
        req.forceStatus ??
        rng.weighted([
          ['confirmed', 7],
          ['pending', 3],
        ] as const);
    }

    const source =
      req.source ??
      (req.visit === 'emergency'
        ? rng.weighted([
            ['ai_booked', 1],
            ['manual', 1],
          ] as const)
        : rng.weighted([
            ['manual', 65],
            ['ai_booked', 35],
          ] as const));

    const bookedAt =
      req.visit === 'emergency'
        ? new Date(slot.start.getTime() - rng.int(1, 4) * HOUR_MS)
        : between(
            maxDate(req.bookedAfter ?? p.createdAt, new Date(slot.start.getTime() - 45 * DAY_MS)),
            minDate(new Date(slot.start.getTime() - 2 * HOUR_MS), now),
          );

    const lines = feeLinesFor(req.visit);
    const visit: PlacedVisit = {
      id: nextId('appt'),
      req,
      provider: slot.provider,
      offset: slot.offset,
      start: slot.start,
      end: slot.end,
      status,
      source,
      bookedAt,
      totalCents: sum(lines.map(lineTotal)),
      insurerCents: 0,
    };
    placed.push(visit);

    const toothLabel = req.tooth ? ` (#${req.tooth})` : '';
    out.appointments.push({
      id: visit.id,
      practiceId: P,
      userId: 'user-receptionist',
      providerId: slot.provider.id,
      roomId: slot.provider.roomId,
      title: `${p.firstName} ${p.lastName} — ${type.label}${toothLabel}`,
      notes:
        status === 'cancelled'
          ? rng.pick([
              'Cancelled by patient — work conflict',
              'Cancelled — patient unwell',
              'Cancelled by patient — travelling',
            ])
          : status === 'no_show'
            ? 'Patient did not attend; courtesy call left.'
            : p.anxious
              ? 'Anxious patient — allow extra time.'
              : null,
      start: slot.start,
      end: slot.end,
      timeZone: TZ,
      patientId: p.id,
      procedureCode: lines[0]?.code ?? (req.visit === 'crown_seat' ? 'D2740' : null),
      status,
      source,
      createdBy: source === 'ai_booked' ? 'ai_agent' : 'user-receptionist',
      createdAt: bookedAt,
    });

    if (source === 'ai_booked') {
      addCall({
        patient: p,
        intent: req.visit === 'emergency' ? 'emergency' : 'booking',
        at: bookedAt,
        appointmentId: visit.id,
        visitLabel: type.label,
        when: slot.start,
      });
    } else if (source === 'rescheduled' && rng.chance(0.5)) {
      addCall({
        patient: p,
        intent: 'reschedule',
        at: bookedAt,
        appointmentId: visit.id,
        when: slot.start,
      });
    }

    // Missed or cancelled → most patients rebook within two weeks.
    if (status === 'cancelled' || status === 'no_show') {
      if (!req.forceStatus && !req.rebooked && rng.chance(0.7)) {
        enqueue({
          ...req,
          target: slot.offset + rng.int(5, 14),
          minOffset: slot.offset + 1,
          source: 'rescheduled',
          rebooked: true,
          bookedAfter: status === 'cancelled' ? new Date(slot.start.getTime() - DAY_MS) : slot.end,
        });
      }
      continue;
    }

    const clinician = slot.provider.userId;

    if (status !== 'completed') {
      // Upcoming restorative work shows as planned treatment.
      if (req.tooth && lines.length) {
        for (const line of lines) {
          out.treatments.push({
            id: nextId('tx'),
            practiceId: P,
            patientId: p.id,
            appointmentId: visit.id,
            providerId: slot.provider.id,
            procedureCode: line.code,
            toothNumber: line.perTooth ? req.tooth : null,
            surface: req.visit === 'filling' ? 'MO' : null,
            notes: line.description,
            status: 'planned',
            createdBy: clinician,
            createdAt: bookedAt,
          });
        }
      }
      if (req.planItem) req.planItem.row.status = 'approved';
      continue;
    }

    // ── Completed visit: clinical records ───────────────────────────────────
    if (
      ['new_patient', 'recall', 'child_recall', 'emergency'].includes(req.visit) &&
      !p.firstExamAt
    ) {
      p.firstExamAt = slot.end;
    }

    const txIds: string[] = [];
    for (const line of lines) {
      const id = nextId('tx');
      txIds.push(id);
      const row: Prisma.TreatmentRecordCreateManyInput = {
        id,
        practiceId: P,
        patientId: p.id,
        appointmentId: visit.id,
        providerId: slot.provider.id,
        procedureCode: line.code,
        toothNumber: line.perTooth ? (req.tooth ?? null) : null,
        surface: req.visit === 'filling' ? 'MO' : null,
        notes: line.description,
        status: req.visit === 'crown_prep' ? 'in_progress' : 'completed',
        completedAt: req.visit === 'crown_prep' ? null : slot.end,
        createdBy: clinician,
        updatedBy: clinician,
        createdAt: slot.end,
      };
      out.treatments.push(row);
      if (req.visit === 'crown_prep' && req.tooth)
        crownRecordByTooth.set(`${p.id}|${req.tooth}`, row);
    }
    if (req.visit === 'crown_seat' && req.tooth) {
      const crown = crownRecordByTooth.get(`${p.id}|${req.tooth}`);
      if (crown) {
        crown.status = 'completed';
        crown.completedAt = slot.end;
        txIds.push(crown.id!);
      }
    }
    if (req.planItem) {
      req.planItem.row.status = 'completed';
      req.planItem.row.treatmentRecordId = txIds[0] ?? null;
    }

    // Tooth chart changes
    if (req.tooth) {
      const t = req.tooth;
      const prev = p.chart.get(t);
      if (req.visit === 'filling') {
        chartSet(
          p,
          t,
          {
            status: 'filled',
            surfaces: ['mesial', 'occlusal'],
            notes: 'Composite restoration',
            chartedAt: slot.end,
            entryStatus: 'resolved',
          },
          clinician,
        );
      } else if (req.visit === 'root_canal') {
        chartSet(
          p,
          t,
          {
            status: 'root_canal',
            surfaces: [],
            notes: 'Root canal completed — crown recommended',
            chartedAt: slot.end,
            entryStatus: 'active',
          },
          clinician,
        );
      } else if (req.visit === 'crown_prep') {
        const rct = prev?.status === 'root_canal';
        chartSet(
          p,
          t,
          {
            status: 'crowned',
            surfaces: [],
            notes: rct
              ? 'Root canal treated — temporary crown, final crown pending'
              : 'Temporary crown — final crown pending',
            chartedAt: slot.end,
            entryStatus: 'planned',
          },
          clinician,
        );
      } else if (req.visit === 'crown_seat') {
        const rct = prev?.notes?.includes('Root canal') ?? false;
        chartSet(
          p,
          t,
          {
            status: 'crowned',
            surfaces: [],
            notes: rct ? 'Root canal treated, ceramic crown' : 'Ceramic crown',
            chartedAt: slot.end,
            entryStatus: 'resolved',
          },
          clinician,
        );
      } else if (req.visit === 'extraction') {
        chartSet(
          p,
          t,
          {
            status: 'missing',
            surfaces: [],
            notes: `Extracted ${isoDay(slot.end)}`,
            chartedAt: slot.end,
            entryStatus: 'resolved',
          },
          clinician,
        );
      }
    }

    // Diagnosis → treatment plan → follow-up visits
    const decayFound: number[] = [];
    if (req.findDecay) {
      for (let i = 0; i < req.findDecay; i++) {
        const t = freshTooth(p);
        if (t === undefined || decayFound.includes(t)) continue;
        decayFound.push(t);
        chartSet(
          p,
          t,
          {
            status: 'decayed',
            surfaces: ['occlusal', 'mesial'],
            notes: 'Caries — restoration planned',
            chartedAt: slot.end,
            entryStatus: 'active',
          },
          clinician,
        );
      }
      if (decayFound.length) {
        const plan = createPlan({
          patient: p,
          provider: p.preferredDentist,
          diagnosedAt: slot.end,
          title: `Restorative — ${decayFound.map((t) => `#${t}`).join(', ')}`,
          items: decayFound.map((t) => ({ visit: 'filling' as const, tooth: t })),
          acceptChance: req.acceptChance ?? 0.6,
        });
        schedulePlan(plan, slot.offset, slot.end, [7, 28]);
      }
    }
    if (req.diagnose === 'crown' || req.diagnose === 'rct_crown') {
      const candidates = MOLARS.filter((m) => p.chart.get(m)?.status === 'filled');
      const t = candidates.length ? rng.pick(candidates) : freshTooth(p, MOLARS);
      if (t !== undefined) {
        chartSet(
          p,
          t,
          {
            status: 'decayed',
            surfaces: ['mesial', 'occlusal', 'distal'],
            notes: 'Fractured restoration — crown recommended',
            chartedAt: slot.end,
            entryStatus: 'active',
          },
          clinician,
        );
        const items: Array<{ visit: VisitKey; tooth: number }> =
          req.diagnose === 'rct_crown'
            ? [
                { visit: 'root_canal', tooth: t },
                { visit: 'crown_prep', tooth: t },
                { visit: 'crown_seat', tooth: t },
              ]
            : [
                { visit: 'crown_prep', tooth: t },
                { visit: 'crown_seat', tooth: t },
              ];
        const plan = createPlan({
          patient: p,
          provider: p.preferredDentist,
          diagnosedAt: slot.end,
          title: req.diagnose === 'rct_crown' ? `Root canal & crown — #${t}` : `Crown — #${t}`,
          items,
          acceptChance: req.acceptChance ?? 0.8,
        });
        schedulePlan(plan, slot.offset, slot.end, [10, 30]);
      }
    }
    if (req.diagnose === 'emergency') {
      const t = freshTooth(p, MOLARS);
      if (t !== undefined) {
        req.tooth = t;
        chartSet(
          p,
          t,
          {
            status: 'decayed',
            surfaces: ['occlusal', 'distal'],
            notes: 'Deep caries, symptomatic',
            chartedAt: slot.end,
            entryStatus: 'active',
          },
          clinician,
        );
        const extract = rng.chance(0.4);
        const plan = createPlan({
          patient: p,
          provider: slot.provider,
          diagnosedAt: slot.end,
          title: extract ? `Extraction — #${t}` : `Root canal & crown — #${t}`,
          items: extract
            ? [{ visit: 'extraction', tooth: t }]
            : [
                { visit: 'root_canal', tooth: t },
                { visit: 'crown_prep', tooth: t },
                { visit: 'crown_seat', tooth: t },
              ],
          acceptChance: 0.95,
        });
        schedulePlan(plan, slot.offset, slot.end, [2, 7]);
      }
    }
    // Next item of a multi-visit plan.
    if (req.plan?.items.length && req.planItem) {
      const gap: [number, number] = req.visit === 'crown_prep' ? [14, 21] : [14, 28];
      schedulePlan(req.plan, slot.offset, slot.end, gap);
    }

    // Clinical note
    const soap = soapFor(req.visit, {
      tooth: req.tooth,
      decayFound,
      perioStage: p.perioStage,
      anxious: p.anxious,
    });
    const recentlyFinished = now.getTime() - slot.end.getTime() < DAY_MS;
    const draft = recentlyFinished && rng.chance(0.4);
    out.encounters.push({
      id: nextId('enc'),
      practiceId: P,
      patientId: p.id,
      appointmentId: visit.id,
      providerId: slot.provider.id,
      authorId: clinician,
      encounterDate: slot.start,
      type: type.encounterType,
      ...soap,
      status: draft ? 'draft' : 'signed',
      signedAt: draft ? null : minDate(addMinutes(slot.end, rng.int(5, 90)), now),
      signedBy: draft ? null : clinician,
      createdAt: slot.end,
    });

    // Periodontal charting
    const perioVisit =
      req.visit === 'srp' ||
      req.visit === 'perio_maint' ||
      req.visit === 'new_patient' ||
      (req.visit === 'recall' && rng.chance(0.35));
    if (perioVisit && p.archetype !== 'child') {
      const improvement = req.visit === 'perio_maint' ? 1 : 0;
      const measurements = Array.from({ length: 32 }, (_, i) => {
        const tooth = i + 1;
        if (p.chart.get(tooth)?.status === 'missing') {
          return {
            tooth_number: tooth,
            pocket_depths: [0, 0, 0, 0, 0, 0],
            bleeding_on_probing: [false, false, false, false, false, false],
            recession_mm: [0, 0, 0, 0, 0, 0],
            mobility_grade: 0,
            notes: 'Missing',
          };
        }
        const molar = MOLARS.includes(tooth);
        const depths = [0, 1, 2, 3, 4, 5].map((site) => {
          const interproximal = site !== 1 && site !== 4;
          if (p.perioStage === 'periodontitis') {
            const deep = molar && interproximal ? rng.int(4, 6) : rng.int(2, 4);
            return Math.max(2, deep - improvement);
          }
          if (p.perioStage === 'gingivitis') return rng.int(2, interproximal ? 4 : 3);
          return rng.int(1, 3);
        });
        return {
          tooth_number: tooth,
          pocket_depths: depths,
          bleeding_on_probing: depths.map((d) =>
            d >= 4 ? rng.chance(0.7) : rng.chance(p.perioStage === 'healthy' ? 0.03 : 0.15),
          ),
          recession_mm: depths.map(() =>
            p.perioStage === 'periodontitis' ? rng.int(0, 2) : rng.chance(0.1) ? 1 : 0,
          ),
          mobility_grade: p.perioStage === 'periodontitis' && molar && rng.chance(0.3) ? 1 : 0,
        };
      });
      const diagnosis =
        p.perioStage === 'periodontitis'
          ? req.visit === 'perio_maint'
            ? 'Periodontitis, Stage II Grade B — stable under maintenance'
            : 'Generalized periodontitis, Stage II Grade B'
          : p.perioStage === 'gingivitis'
            ? 'Generalized plaque-induced gingivitis'
            : 'Healthy periodontium';
      const recommendations =
        p.perioStage === 'periodontitis'
          ? [
              'Periodontal maintenance every 3 months',
              'Interdental brushes daily',
              ...(p.smoking === 'current' ? ['Smoking cessation counselling'] : []),
            ]
          : p.perioStage === 'gingivitis'
            ? ['Improve flossing technique', 'Recall in 6 months']
            : ['Continue current home care', 'Recall in 6 months'];
      out.perioExams.push({
        id: nextId('perio'),
        practiceId: P,
        patientId: p.id,
        examDate: slot.start,
        examinedBy: clinician,
        measurements: json({
          examiner_name: slot.provider.name,
          tooth_measurements: measurements,
          overall_diagnosis: diagnosis,
          treatment_recommendations: recommendations,
          notes:
            p.smoking === 'current' ? 'Current smoker — elevated periodontal risk.' : undefined,
        }),
        summary: diagnosis,
        createdAt: slot.end,
      });
    }

    // ── Billing: invoice, payments, insurance claim ─────────────────────────
    if (!lines.length) continue;
    const total = visit.totalCents;
    const ageDays = (now.getTime() - slot.end.getTime()) / DAY_MS;
    const insurerShare = sum(
      lines.map((l) => Math.round((lineTotal(l) * coveragePct(p, l.category)) / 100)),
    );
    const invoiceId = nextId('inv');
    const payments: Prisma.PaymentRecordCreateManyInput[] = [];
    const pay = (args: {
      payerType: 'patient' | 'insurance';
      method: string;
      cents: number;
      at: Date;
    }) => {
      if (args.cents <= 0 || args.at > now) return;
      const ref =
        args.method === 'card'
          ? nextRef('CH')
          : args.method === 'ach'
            ? nextRef('ET')
            : args.method === 'check'
              ? nextRef('CHQ')
              : args.method === 'insurance'
                ? nextRef('EFT')
                : null;
      payments.push({
        id: nextId('pay'),
        practiceId: P,
        invoiceId,
        patientId: p.id,
        payerType: args.payerType,
        method: args.method,
        amountCents: args.cents,
        status: 'completed',
        transactionRef: ref,
        createdBy: args.payerType === 'insurance' ? null : 'user-receptionist',
        paidAt: args.at,
        createdAt: args.at,
      });
      completedPaymentsByDay.push({ at: args.at, cents: args.cents });
    };
    const patientMethod = () =>
      rng.weighted([
        ['card', 65],
        ['ach', 15],
        ['cash', 15],
        ['check', 5],
      ] as const);
    // Most patients settle their portion at checkout; a few leave a balance.
    const leavesBalance = ageDays > 35 ? rng.chance(0.08) : rng.chance(0.25);

    if (p.insurance) {
      const claimId = nextId('claim');
      const submittedAt = new Date(slot.end.getTime() + 2 * HOUR_MS);
      let claimStatus: 'submitted' | 'accepted' | 'paid' | 'rejected' =
        ageDays < 2
          ? 'submitted'
          : ageDays < 10
            ? 'accepted'
            : rng.chance(0.94)
              ? 'paid'
              : 'rejected';
      const acceptedAt = new Date(submittedAt.getTime() + rng.int(1, 4) * DAY_MS);
      let resolvedAt: Date | null =
        claimStatus === 'paid' || claimStatus === 'rejected'
          ? new Date(acceptedAt.getTime() + rng.int(4, 9) * DAY_MS)
          : claimStatus === 'accepted'
            ? acceptedAt
            : null;
      if (resolvedAt && resolvedAt > now) {
        claimStatus = acceptedAt <= now ? 'accepted' : 'submitted';
        resolvedAt = claimStatus === 'accepted' ? acceptedAt : null;
      }
      const approved =
        claimStatus === 'rejected' || claimStatus === 'submitted' ? null : insurerShare;
      visit.insurerCents = claimStatus === 'rejected' ? 0 : insurerShare;
      out.claims.push({
        id: claimId,
        practiceId: P,
        patientId: p.id,
        insuranceId: p.insurance.id,
        treatmentId: txIds[0] ?? null,
        invoiceId,
        claimNumber: nextRef('CLM'),
        status: claimStatus,
        totalChargedCents: total,
        approvedAmountCents: approved,
        rejectionCode: claimStatus === 'rejected' ? 'FREQ' : null,
        notes:
          claimStatus === 'rejected'
            ? 'Frequency limitation — service already paid within the benefit period.'
            : null,
        submittedAt,
        resolvedAt,
        createdBy: 'user-receptionist',
        createdAt: slot.end,
      });
      lines.forEach((l) => {
        out.claimLines.push({
          id: nextId('cline'),
          claimId,
          procedureCode: l.code,
          description: l.description,
          toothNumber: l.perTooth ? (req.tooth ?? null) : null,
          chargedCents: lineTotal(l),
          allowedCents:
            approved === null
              ? null
              : Math.round((lineTotal(l) * coveragePct(p, l.category)) / 100),
          createdAt: slot.end,
        });
      });
      const event = (status: string, atTime: Date, extra: { code?: string; note?: string } = {}) =>
        out.claimEvents.push({
          id: nextId('cevt'),
          claimId,
          status,
          code: extra.code ?? null,
          note: extra.note ?? null,
          actorUserId: status === 'draft' || status === 'submitted' ? 'user-receptionist' : null,
          createdAt: atTime,
        });
      event('draft', slot.end);
      event('submitted', submittedAt, {
        note: `Submitted electronically to ${p.insurance.payerName}`,
      });
      if (claimStatus !== 'submitted') {
        if (claimStatus === 'rejected') {
          event('rejected', resolvedAt!, { code: 'FREQ', note: 'Frequency limitation' });
        } else {
          event('accepted', acceptedAt, { note: 'Adjudicated' });
          if (claimStatus === 'paid') event('paid', resolvedAt!, { note: 'EFT received' });
        }
      }
      if (claimStatus === 'paid') {
        pay({ payerType: 'insurance', method: 'insurance', cents: insurerShare, at: resolvedAt! });
      }
      if (!leavesBalance) {
        // Co-pay at checkout; after a rejection the patient pays the rest later.
        pay({
          payerType: 'patient',
          method: patientMethod(),
          cents: total - insurerShare,
          at: addMinutes(slot.end, 5),
        });
        if (claimStatus === 'rejected') {
          pay({
            payerType: 'patient',
            method: patientMethod(),
            cents: insurerShare,
            at: new Date(resolvedAt!.getTime() + rng.int(3, 12) * DAY_MS),
          });
        }
      } else if (rng.chance(0.3) && ageDays > 20) {
        addCall({
          patient: p,
          intent: 'billing',
          at: new Date(slot.end.getTime() + rng.int(12, 20) * DAY_MS),
        });
      }
    } else if (!leavesBalance) {
      pay({
        payerType: 'patient',
        method: patientMethod(),
        cents: total,
        at: addMinutes(slot.end, 5),
      });
    }

    const paidCents = sum(payments.map((x) => x.amountCents));
    const dueDate = new Date(slot.end.getTime() + 30 * DAY_MS);
    const lastPaidAt = payments.reduce<Date | null>((latest, x) => {
      const paidAt = x.paidAt ? new Date(x.paidAt) : null;
      return paidAt && (!latest || paidAt > latest) ? paidAt : latest;
    }, null);
    out.invoices.push({
      id: invoiceId,
      practiceId: P,
      patientId: p.id,
      treatmentId: txIds[0] ?? null,
      payerType: p.insurance ? 'insurance' : 'patient',
      status: paidCents >= total ? 'paid' : dueDate < now ? 'overdue' : 'sent',
      totalAmountCents: total,
      lineItems: json(
        lines.map((l) => ({
          description: `${l.description}${l.perTooth && req.tooth ? ` (#${req.tooth})` : ''}`,
          procedureCode: l.code,
          qty: l.qty ?? 1,
          unitPriceCents: l.feeCents,
        })),
      ),
      notes: p.insurance ? `Assigned benefits — ${p.insurance.payerName}` : null,
      dueDate,
      issuedAt: slot.end,
      paidAt: paidCents >= total ? lastPaidAt : null,
      createdBy: 'user-receptionist',
      updatedBy: 'user-receptionist',
      createdAt: slot.end,
    });
    out.payments.push(...payments);

    if (paidCents < total && dueDate < now) {
      const sentAt = new Date(dueDate.getTime() + 3 * DAY_MS + 10 * HOUR_MS);
      if (sentAt <= now) {
        out.reminders.push({
          id: nextId('rem'),
          practiceId: P,
          patientId: p.id,
          channel: p.reminderMethod === 'sms' ? 'sms' : 'email',
          type: 'payment_due',
          status: 'sent',
          scheduledAt: sentAt,
          sentAt,
          metadata: json({
            to: p.reminderMethod === 'sms' ? p.phone : p.email,
            patientName: p.firstName,
            amountDueCents: total - paidCents,
            body: `Hi ${p.firstName}, you have a balance of $${((total - paidCents) / 100).toFixed(2)} with ${DEMO_PRACTICE_NAME}.`,
          }),
          createdAt: sentAt,
        });
      }
    }
  }

  // ── Plan status roll-up ─────────────────────────────────────────────────────
  for (const plan of plans) {
    const statuses = plan.items.map((i) => i.row.status);
    if (plan.decision === 'declined') {
      plan.row.status = 'cancelled';
      plan.row.notes = 'Patient declined — cost. Revisit at next recall.';
      for (const i of plan.items) i.row.status = 'declined';
    } else if (plan.decision === 'pending') {
      plan.row.status = 'proposed';
    } else if (statuses.every((s) => s === 'completed')) {
      plan.row.status = 'completed';
    } else {
      plan.row.status = 'accepted';
      for (const i of plan.items) if (i.row.status === 'planned') i.row.status = 'approved';
    }
    if (plan.decision === 'accepted') {
      plan.row.acceptedAt = plan.decidedAt;
      plan.row.acceptedBy = 'user-receptionist';
    }
    out.plans.push(plan.row);
    out.planItems.push(...plan.items.map((i) => i.row));
  }

  // ── Tooth chart: whole mouth charted after the first exam ──────────────────
  for (const p of patients) {
    if (!p.firstExamAt) continue;
    const teeth =
      p.archetype === 'child' ? CHILD_TEETH : Array.from({ length: 32 }, (_, i) => i + 1);
    for (const t of teeth) {
      const s = p.chart.get(t) ?? {
        status: 'healthy' as const,
        surfaces: [],
        chartedAt: p.firstExamAt,
        entryStatus: 'active' as const,
        chartedBy: 'user-doctor',
      };
      out.toothChart.push({
        id: nextId('tooth'),
        practiceId: P,
        patientId: p.id,
        toothNumber: t,
        surfaces: s.surfaces,
        condition: s.status,
        status: s.entryStatus,
        notes: s.notes ?? null,
        chartedBy: s.chartedBy,
        chartedAt: maxDate(s.chartedAt, p.createdAt),
        createdAt: maxDate(s.chartedAt, p.createdAt),
      });
    }
  }

  // ── Reminders ───────────────────────────────────────────────────────────────
  for (const v of placed) {
    const p = v.req.patient;
    const channel = p.reminderMethod === 'email' ? 'email' : 'sms';
    const scheduledAt = new Date(v.start.getTime() - DAY_MS);
    if (scheduledAt < v.bookedAt) continue; // booked less than a day ahead
    const body = `Hi ${p.firstName}, this is a reminder of your ${VISIT_TYPES[v.req.visit].label.toLowerCase()} at ${DEMO_PRACTICE_NAME} on ${fmtWhen(v.start)}. Reply C to confirm.`;
    // Reminders are only ever seeded as sent or cancelled. Future ones are left
    // for the reminder worker, so a reseed can never queue a real send.
    const status = v.status === 'cancelled' ? 'cancelled' : scheduledAt <= now ? 'sent' : null;
    if (!status) continue;
    out.reminders.push({
      id: nextId('rem'),
      practiceId: P,
      patientId: p.id,
      appointmentId: v.id,
      channel,
      type: 'appointment_reminder',
      status,
      scheduledAt,
      sentAt: status === 'sent' ? scheduledAt : null,
      metadata: json({
        to: channel === 'sms' ? p.phone : p.email,
        patientName: p.firstName,
        startsAt: v.start.toISOString(),
        body,
      }),
      createdAt: v.bookedAt,
    });
  }
  for (const p of patients.filter((x) => x.archetype === 'lapsed')) {
    const sentAt = at(-rng.int(10, 25), 10 * 60);
    out.reminders.push({
      id: nextId('rem'),
      practiceId: P,
      patientId: p.id,
      channel: p.reminderMethod === 'email' ? 'email' : 'sms',
      type: 'recall',
      status: 'sent',
      scheduledAt: sentAt,
      sentAt,
      metadata: json({
        to: p.reminderMethod === 'email' ? p.email : p.phone,
        patientName: p.firstName,
        body: `Hi ${p.firstName}, you're overdue for your checkup at ${DEMO_PRACTICE_NAME}. Reply or call us to book.`,
      }),
      createdAt: sentAt,
    });
  }

  // ── Insurance (after claims, so benefits used this year are accurate) ──────
  const yearStart = atLocal({ y: today.y, m: 1, d: 1 }, 0, TZ);
  for (const p of patients) {
    if (!p.insurance) continue;
    const usedThisYear = sum(
      placed
        .filter((v) => v.req.patient === p && v.status === 'completed' && v.end >= yearStart)
        .map((v) => v.insurerCents),
    );
    out.insurance.push({
      id: p.insurance.id,
      patientId: p.id,
      payerName: p.insurance.payerName,
      planName: p.insurance.planName,
      memberIdEnc: opts.encrypt(p.insurance.memberId),
      memberIdHash: opts.hashIdentifier(p.insurance.memberId),
      groupNumberEnc: opts.encrypt(p.insurance.groupNumber),
      coverageSummary: json({
        ...p.insurance.coverage,
        deductibleCents: p.insurance.deductibleCents,
        usedToDateCents: usedThisYear,
        orthoPct: 0,
        effectiveFrom: isoDay(yearStart),
      }),
      active: true,
      verifiedAt: maxDate(p.createdAt, new Date(now.getTime() - rng.int(5, 90) * DAY_MS)),
      createdAt: p.createdAt,
    });
  }

  // ── Medical history blobs (about half the patients; the rest stay empty) ───
  for (const p of patients) {
    if (!p.hasHistoryBlob) continue;
    const visits = placed
      .filter((v) => v.req.patient === p && v.status === 'completed')
      .sort((a, b) => b.start.getTime() - a.start.getTime());
    const lastOf = (keys: VisitKey[]) => visits.find((v) => keys.includes(v.req.visit))?.start;
    const lastCleaning = lastOf(['recall', 'child_recall', 'perio_maint', 'srp']);
    const lastExam = lastOf(['recall', 'child_recall', 'new_patient']);
    out.medicalHistories.push({
      patientId: p.id,
      history: json({
        patient_id: p.id,
        allergies: [],
        current_medications: [],
        systemic_conditions: [],
        past_surgeries:
          p.archetype === 'child' || rng.chance(0.5)
            ? []
            : rng.sample(SURGERIES, rng.int(1, 2)).map((procedure, i) => ({
                id: `${p.id}-surgery-${i + 1}`,
                procedure,
                date: isoDay(new Date(p.createdAt.getTime() - rng.int(2, 25) * 365 * DAY_MS)),
                hospital: 'Toronto General Hospital',
              })),
        lifestyle_factors: {
          smoking:
            p.smoking === 'current'
              ? { status: 'current', packs_per_day: 0.5, years: rng.int(5, 30) }
              : p.smoking === 'former'
                ? {
                    status: 'former',
                    quit_date: isoDay(new Date(now.getTime() - rng.int(1, 15) * 365 * DAY_MS)),
                  }
                : { status: 'never' },
          alcohol:
            p.archetype === 'child'
              ? { frequency: 'never' }
              : rng.weighted([
                  [{ frequency: 'never' }, 2],
                  [{ frequency: 'occasional', drinks_per_week: rng.int(1, 3) }, 5],
                  [{ frequency: 'moderate', drinks_per_week: rng.int(4, 8) }, 2],
                ] as const),
          exercise_frequency: rng.pick(['Rarely', '1–2 times a week', '3–4 times a week', 'Daily']),
        },
        family_health_history: rng.chance(0.6)
          ? [
              {
                id: `${p.id}-fh-1`,
                relation: 'Mother',
                conditions: rng.sample(FAMILY_CONDITIONS, rng.int(1, 2)),
              },
              ...(rng.chance(0.5)
                ? [
                    {
                      id: `${p.id}-fh-2`,
                      relation: 'Father',
                      conditions: rng.sample(FAMILY_CONDITIONS, 1),
                    },
                  ]
                : []),
            ]
          : [],
        dental_history: {
          last_cleaning_date: lastCleaning ? isoDay(lastCleaning) : undefined,
          last_exam_date: lastExam ? isoDay(lastExam) : undefined,
          previous_orthodontics: rng.chance(0.25),
          previous_implants: false,
          dental_anxiety_level: p.anxious
            ? 'moderate'
            : rng.weighted([
                ['none', 6],
                ['mild', 3],
              ] as const),
          treatment_history_summary: visits.slice(0, 5).map((v) => ({
            id: `th-${v.id}`,
            date: isoDay(v.start),
            procedure: VISIT_TYPES[v.req.visit].label,
            teeth_involved: v.req.tooth ? [v.req.tooth] : [],
            dentist_name: v.provider.name,
            cost: v.totalCents / 100,
            insurance_covered: v.insurerCents / 100,
          })),
        },
      }),
      createdAt: p.createdAt,
    });
  }

  // ── Daily KPIs (what the nightly analytics job would have written) ─────────
  const pastVisits = placed.filter((v) => v.end <= now);
  const inWindow = <T>(items: T[], when: (x: T) => Date, from: Date, to: Date) =>
    items.filter((x) => when(x) >= from && when(x) < to);
  let dentistSat = 8.6;
  let hygienistSat = 8.9;
  for (let off = -HISTORY_DAYS + 1; off <= -1; off++) {
    const dayStart = at(off, 0);
    const dayEnd = at(off + 1, 0);
    const kpi = (metricName: string, metricValue: number) =>
      out.kpis.push({
        practiceId: P,
        kpiDate: dayStart,
        metricName,
        metricValue: Math.round(metricValue * 10_000) / 10_000,
        dimensions: json({ source: 'demo_seed' }),
        createdAt: dayEnd,
      });
    const week = inWindow(callSignals, (c) => c.at, at(off - 6, 0), dayEnd);
    if (week.length) kpi('avg_sentiment', sum(week.map((c) => c.sentiment)) / week.length);
    const decisions = inWindow(callSignals, (c) => c.at, at(off - 29, 0), dayEnd).filter(
      (c) => c.accepted !== null,
    );
    if (decisions.length) {
      kpi(
        'treatment_acceptance_rate',
        decisions.filter((c) => c.accepted).length / decisions.length,
      );
    }
    const month = inWindow(pastVisits, (v) => v.start, at(off - 29, 0), dayEnd);
    if (month.length)
      kpi('no_show_rate', month.filter((v) => v.status === 'no_show').length / month.length);
    kpi('completed_appointments_30d', month.filter((v) => v.status === 'completed').length);
    kpi(
      'revenue_30d_cents',
      sum(
        inWindow(completedPaymentsByDay, (x) => x.at, at(off - 29, 0), dayEnd).map((x) => x.cents),
      ),
    );
    kpi('total_patients', patients.filter((p) => p.createdAt < dayEnd).length);
    kpi(
      'scheduled_count',
      placed.filter((v) => v.offset === off && v.status !== 'cancelled').length,
    );
    dentistSat = Math.min(9.8, Math.max(7.6, dentistSat + (rng.next() - 0.5) * 0.3));
    hygienistSat = Math.min(9.9, Math.max(7.9, hygienistSat + (rng.next() - 0.5) * 0.3));
    kpi('provider_satisfaction_dentist', dentistSat);
    kpi('provider_satisfaction_hygienist', hygienistSat);
  }

  return out;
}
