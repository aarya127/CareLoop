// Bridges the rich dental-record.ts UI types <-> the flat EMR API models, so the
// existing MedicalHistorySection component can be backed by first-class EMR
// tables (allergies / medications / conditions) without rewriting the component.
// Surgeries, lifestyle, family history and dental history have no EMR model yet
// and continue to live in the legacy record blob.
import {
  emrApi,
  type Allergy as EmrAllergy,
  type Condition as EmrCondition,
  type Medication as EmrMedication,
  type PeriodontalExam as EmrPeriodontalExam,
  type ToothChartEntry,
} from './emr';
import type {
  Allergy,
  Medication,
  PeriodontalExam as UiPeriodontalExam,
  SystemicCondition,
  ToothRecord,
  ToothSurface,
} from '@/lib/types/dental-record';

const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe', 'life_threatening'];
const day = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : '');

// ── EMR → UI ────────────────────────────────────────────────────────────────
export function emrAllergyToUi(a: EmrAllergy): Allergy {
  return {
    id: a.id,
    allergen: a.allergen,
    severity: (ALLERGY_SEVERITIES.includes(a.severity) ? a.severity : 'moderate') as Allergy['severity'],
    reaction: a.reaction ?? '',
    date_identified: day(a.notedAt),
  };
}

export function emrMedicationToUi(m: EmrMedication): Medication {
  return {
    id: m.id,
    name: m.name,
    dosage: m.dosage ?? '',
    frequency: m.frequency ?? '',
    purpose: m.notes ?? '',
    start_date: day(m.startDate),
    end_date: m.endDate ? day(m.endDate) : undefined,
    prescribing_doctor: m.prescribedBy ?? undefined,
    notes: m.notes ?? undefined,
  };
}

export function emrConditionToUi(c: EmrCondition): SystemicCondition {
  const status: SystemicCondition['status'] =
    c.status === 'resolved' ? 'resolved' : c.status === 'chronic' ? 'controlled' : 'active';
  return {
    id: c.id,
    condition: c.name,
    diagnosed_date: day(c.onsetDate),
    status,
    severity: 'moderate',
    treatment: c.notes ?? undefined,
    notes: c.notes ?? undefined,
  };
}

// ── UI → EMR DTOs ─────────────────────────────────────────────────────────────
const uiAllergyToEmr = (a: Allergy) => ({
  allergen: a.allergen,
  severity: a.severity,
  reaction: a.reaction || undefined,
  status: 'active',
});
const uiMedicationToEmr = (m: Medication) => ({
  name: m.name,
  dosage: m.dosage || undefined,
  frequency: m.frequency || undefined,
  notes: m.notes || m.purpose || undefined,
  startDate: m.start_date || undefined,
  endDate: m.end_date || undefined,
  prescribedBy: m.prescribing_doctor || undefined,
  status: 'active',
});
const uiConditionToEmr = (c: SystemicCondition) => ({
  name: c.condition,
  status: c.status === 'resolved' ? 'resolved' : c.status === 'controlled' ? 'chronic' : 'active',
  onsetDate: c.diagnosed_date || undefined,
  notes: c.notes || c.treatment || undefined,
});

// ── Load the three EMR-backed slices for a patient ────────────────────────────
export async function loadEmrMedicalSlices(patientId: string): Promise<{
  allergies: Allergy[];
  current_medications: Medication[];
  systemic_conditions: SystemicCondition[];
}> {
  const [allergies, medications, conditions] = await Promise.all([
    emrApi.listAllergies(patientId),
    emrApi.listMedications(patientId),
    emrApi.listConditions(patientId),
  ]);
  return {
    allergies: allergies.map(emrAllergyToUi),
    current_medications: medications.map(emrMedicationToUi),
    systemic_conditions: conditions.map(emrConditionToUi),
  };
}

// ── Diff-and-sync a UI list to the EMR API ────────────────────────────────────
async function syncList<T extends { id: string }>(
  prev: T[],
  next: T[],
  ops: {
    create: (item: T) => Promise<unknown>;
    update: (id: string, item: T) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
    toDto: (item: T) => Record<string, unknown>;
  },
): Promise<void> {
  const prevById = new Map(prev.map((p) => [p.id, p]));
  const nextIds = new Set(next.map((n) => n.id));

  for (const p of prev) {
    if (!nextIds.has(p.id)) await ops.remove(p.id);
  }
  for (const n of next) {
    const old = prevById.get(n.id);
    if (!old) {
      await ops.create(n); // new item (client-generated id) → create
    } else if (JSON.stringify(ops.toDto(old)) !== JSON.stringify(ops.toDto(n))) {
      await ops.update(n.id, n);
    }
  }
}

/**
 * Persist changes to the three EMR-backed slices. `prev`/`next` hold the UI
 * arrays before/after the edit. Returns fresh, server-authoritative slices so
 * the caller can reconcile client-generated ids.
 */
export async function syncEmrMedicalSlices(
  patientId: string,
  prev: {
    allergies?: Allergy[];
    current_medications?: Medication[];
    systemic_conditions?: SystemicCondition[];
  },
  next: {
    allergies?: Allergy[];
    current_medications?: Medication[];
    systemic_conditions?: SystemicCondition[];
  },
): Promise<Awaited<ReturnType<typeof loadEmrMedicalSlices>>> {
  if (next.allergies) {
    await syncList(prev.allergies ?? [], next.allergies, {
      create: (a) => emrApi.createAllergy(patientId, uiAllergyToEmr(a)),
      update: (id, a) => emrApi.updateAllergy(id, uiAllergyToEmr(a)),
      remove: (id) => emrApi.deleteAllergy(id),
      toDto: uiAllergyToEmr,
    });
  }
  if (next.current_medications) {
    await syncList(prev.current_medications ?? [], next.current_medications, {
      create: (m) => emrApi.createMedication(patientId, uiMedicationToEmr(m)),
      update: (id, m) => emrApi.updateMedication(id, uiMedicationToEmr(m)),
      remove: (id) => emrApi.deleteMedication(id),
      toDto: uiMedicationToEmr,
    });
  }
  if (next.systemic_conditions) {
    await syncList(prev.systemic_conditions ?? [], next.systemic_conditions, {
      create: (c) => emrApi.createCondition(patientId, uiConditionToEmr(c)),
      update: (id, c) => emrApi.updateCondition(id, uiConditionToEmr(c)),
      remove: (id) => emrApi.deleteCondition(id),
      toDto: uiConditionToEmr,
    });
  }
  return loadEmrMedicalSlices(patientId);
}

// ============================================================================
// Tooth chart  (ToothChartEntry  <->  ClinicalChart.teeth / ToothRecord)
// ============================================================================
const TOOTH_STATUS_VALUES: ToothRecord['status'][] = [
  'healthy', 'decayed', 'filled', 'crowned', 'missing', 'implant', 'bridge', 'root_canal',
];
// The EMR `condition` string stores the UI clinical status directly; map a few
// synonyms back for resilience.
const CONDITION_TO_STATUS: Record<string, ToothRecord['status']> = {
  caries: 'decayed', cavity: 'decayed', decayed: 'decayed',
  filling: 'filled', filled: 'filled',
  crown: 'crowned', crowned: 'crowned',
  missing: 'missing', implant: 'implant', bridge: 'bridge', root_canal: 'root_canal',
  healthy: 'healthy',
};
const COLOR_BY_STATUS: Record<ToothRecord['status'], string> = {
  healthy: '#22c55e', decayed: '#ef4444', filled: '#3b82f6', crowned: '#a855f7',
  missing: '#9ca3af', implant: '#14b8a6', bridge: '#f59e0b', root_canal: '#ec4899',
};

function emrToothToUi(e: ToothChartEntry): ToothRecord {
  const status = CONDITION_TO_STATUS[e.condition] ?? 'healthy';
  return {
    tooth_number: e.toothNumber,
    status,
    surfaces_affected: (e.surfaces ?? []) as ToothSurface[],
    notes: e.notes ?? undefined,
    color_code: COLOR_BY_STATUS[status] ?? '#e5e7eb',
    last_treated_date: e.chartedAt ? day(e.chartedAt) : undefined,
  };
}

const uiToothToEmr = (t: ToothRecord) => ({
  condition: TOOTH_STATUS_VALUES.includes(t.status) ? t.status : 'healthy',
  surfaces: (t.surfaces_affected ?? []).map(String),
  status: 'active',
  notes: t.notes || undefined,
});

const toothIsCharted = (t: ToothRecord) =>
  t.status !== 'healthy' || (t.surfaces_affected?.length ?? 0) > 0 || Boolean(t.notes);

/** Load charted teeth from the EMR, keyed by tooth number, to overlay a chart. */
export async function loadToothChartByNumber(patientId: string): Promise<Map<number, ToothRecord>> {
  const entries = await emrApi.getToothChart(patientId);
  return new Map(entries.map((e) => [e.toothNumber, emrToothToUi(e)]));
}

/** Merge EMR-charted teeth onto a base set (which supplies the full 1-32 arch). */
export function mergeToothChart(
  baseTeeth: ToothRecord[],
  emrByNumber: Map<number, ToothRecord>,
): ToothRecord[] {
  return baseTeeth.map((t) => emrByNumber.get(t.tooth_number) ?? t);
}

/** Upsert only teeth whose charted state actually changed. */
export async function syncToothChart(
  patientId: string,
  prevTeeth: ToothRecord[],
  nextTeeth: ToothRecord[],
): Promise<void> {
  const prevByNum = new Map(prevTeeth.map((t) => [t.tooth_number, t]));
  for (const t of nextTeeth) {
    const old = prevByNum.get(t.tooth_number);
    const changed = !old || JSON.stringify(uiToothToEmr(old)) !== JSON.stringify(uiToothToEmr(t));
    if (changed && toothIsCharted(t)) {
      await emrApi.upsertToothEntry(patientId, t.tooth_number, uiToothToEmr(t));
    }
  }
}

// ============================================================================
// Periodontal exams  (PeriodontalExam EMR  <->  PeriodontalRecords.exams UI)
// The full UI exam is stored losslessly in the EMR row's `measurements` JSON.
// ============================================================================
function emrPerioToUi(e: EmrPeriodontalExam): UiPeriodontalExam {
  const m = (e.measurements ?? {}) as Partial<UiPeriodontalExam>;
  return {
    exam_id: e.id,
    exam_date: day(e.examDate),
    examiner_name: m.examiner_name ?? '',
    tooth_measurements: m.tooth_measurements ?? [],
    overall_diagnosis: e.summary ?? m.overall_diagnosis ?? '',
    treatment_recommendations: m.treatment_recommendations,
    notes: m.notes,
  };
}

/** Load periodontal exams (most recent first) as UI exams. */
export async function loadEmrPerioExams(patientId: string): Promise<UiPeriodontalExam[]> {
  const exams = await emrApi.listPeriodontalExams(patientId);
  return exams.map(emrPerioToUi);
}

/**
 * Create any exams that don't yet exist server-side (perio exams are point-in-time
 * records — the API is create + read only). Returns the fresh server list.
 */
export async function syncEmrPerioExams(
  patientId: string,
  prevExams: UiPeriodontalExam[],
  nextExams: UiPeriodontalExam[],
): Promise<UiPeriodontalExam[]> {
  const prevIds = new Set(prevExams.map((e) => e.exam_id));
  for (const exam of nextExams) {
    if (!prevIds.has(exam.exam_id)) {
      await emrApi.createPeriodontalExam(patientId, {
        examDate: exam.exam_date || undefined,
        summary: exam.overall_diagnosis || undefined,
        measurements: {
          examiner_name: exam.examiner_name,
          tooth_measurements: exam.tooth_measurements,
          overall_diagnosis: exam.overall_diagnosis,
          treatment_recommendations: exam.treatment_recommendations,
          notes: exam.notes,
        } as Record<string, unknown>,
      });
    }
  }
  return loadEmrPerioExams(patientId);
}
