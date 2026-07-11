// Typed client for the EMR module (encounters, allergies, medications,
// conditions, tooth chart, periodontal exams). Session cookie is sent via
// credentials:'include'; tenancy + author are derived server-side from the
// session, so no practiceId/actor is sent from the browser.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://careloop-tf2l.onrender.com';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface Encounter {
  id: string;
  practiceId: string;
  patientId: string;
  appointmentId?: string | null;
  providerId?: string | null;
  authorId?: string | null;
  encounterDate: string;
  type: string;
  chiefComplaint?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  status: 'draft' | 'signed' | 'amended';
  signedAt?: string | null;
  signedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  severity: string;
  reaction?: string | null;
  status: string;
  notedAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  prescribedBy?: string | null;
  notes?: string | null;
}

export interface Condition {
  id: string;
  patientId: string;
  name: string;
  code?: string | null;
  status: string;
  onsetDate?: string | null;
  resolvedDate?: string | null;
  notes?: string | null;
}

export interface ToothChartEntry {
  id: string;
  patientId: string;
  toothNumber: number;
  surfaces: string[];
  condition: string;
  status: string;
  notes?: string | null;
  chartedAt: string;
}

export interface PeriodontalExam {
  id: string;
  patientId: string;
  examDate: string;
  examinedBy?: string | null;
  measurements?: Record<string, unknown> | null;
  summary?: string | null;
}

export interface TimelineEvent {
  id: string;
  type: 'encounter' | 'treatment' | 'document' | 'appointment';
  date: string;
  title: string;
  detail?: string | null;
  status?: string | null;
}

// ── Client ───────────────────────────────────────────────────────────────
export const emrApi = {
  // Encounters
  listEncounters: (patientId: string) => apiFetch<Encounter[]>(`/patients/${patientId}/encounters`),
  getEncounter: (id: string) => apiFetch<Encounter>(`/encounters/${id}`),
  createEncounter: (patientId: string, dto: Partial<Encounter>, idempotencyKey?: string) =>
    apiFetch<Encounter>(`/patients/${patientId}/encounters`, {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),
  updateEncounter: (id: string, dto: Partial<Encounter>) =>
    apiFetch<Encounter>(`/encounters/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  signEncounter: (id: string) => apiFetch<Encounter>(`/encounters/${id}/sign`, { method: 'POST' }),

  // Allergies
  listAllergies: (patientId: string) => apiFetch<Allergy[]>(`/patients/${patientId}/allergies`),
  createAllergy: (patientId: string, dto: Partial<Allergy>) =>
    apiFetch<Allergy>(`/patients/${patientId}/allergies`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateAllergy: (id: string, dto: Partial<Allergy>) =>
    apiFetch<Allergy>(`/allergies/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  deleteAllergy: (id: string) => apiFetch<void>(`/allergies/${id}`, { method: 'DELETE' }),

  // Medications
  listMedications: (patientId: string) =>
    apiFetch<Medication[]>(`/patients/${patientId}/medications`),
  createMedication: (patientId: string, dto: Partial<Medication>) =>
    apiFetch<Medication>(`/patients/${patientId}/medications`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateMedication: (id: string, dto: Partial<Medication>) =>
    apiFetch<Medication>(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  deleteMedication: (id: string) => apiFetch<void>(`/medications/${id}`, { method: 'DELETE' }),

  // Conditions (problem list)
  listConditions: (patientId: string) => apiFetch<Condition[]>(`/patients/${patientId}/conditions`),
  createCondition: (patientId: string, dto: Partial<Condition>) =>
    apiFetch<Condition>(`/patients/${patientId}/conditions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateCondition: (id: string, dto: Partial<Condition>) =>
    apiFetch<Condition>(`/conditions/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  deleteCondition: (id: string) => apiFetch<void>(`/conditions/${id}`, { method: 'DELETE' }),

  // Tooth chart
  getToothChart: (patientId: string) =>
    apiFetch<ToothChartEntry[]>(`/patients/${patientId}/tooth-chart`),
  upsertToothEntry: (patientId: string, toothNumber: number, dto: Partial<ToothChartEntry>) =>
    apiFetch<ToothChartEntry>(`/patients/${patientId}/tooth-chart/${toothNumber}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  // Timeline (chronological clinical activity)
  getTimeline: (patientId: string) => apiFetch<TimelineEvent[]>(`/patients/${patientId}/timeline`),

  // Periodontal exams
  listPeriodontalExams: (patientId: string) =>
    apiFetch<PeriodontalExam[]>(`/patients/${patientId}/periodontal-exams`),
  createPeriodontalExam: (patientId: string, dto: Partial<PeriodontalExam>) =>
    apiFetch<PeriodontalExam>(`/patients/${patientId}/periodontal-exams`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  getPeriodontalExam: (id: string) => apiFetch<PeriodontalExam>(`/periodontal-exams/${id}`),
};
