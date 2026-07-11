// Typed client for the Treatment Plans API (grouped planned procedures with a
// running estimate and an acceptance step). Session cookie via credentials.

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

export interface TreatmentPlanItem {
  id: string;
  planId: string;
  toothNumber?: number | null;
  surface?: string | null;
  procedureCode?: string | null;
  description: string;
  feeCents: number;
  status: 'planned' | 'approved' | 'completed' | 'declined';
  sortOrder: number;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  providerId?: string | null;
  title: string;
  status: 'draft' | 'proposed' | 'accepted' | 'completed' | 'cancelled';
  estimatedCostCents: number;
  insuranceEstimateCents: number;
  notes?: string | null;
  acceptedAt?: string | null;
  items: TreatmentPlanItem[];
  createdAt: string;
}

export interface NewPlanItem {
  description: string;
  toothNumber?: number;
  surface?: string;
  procedureCode?: string;
  feeCents?: number;
}

export const treatmentPlansApi = {
  list: (patientId: string) => apiFetch<TreatmentPlan[]>(`/patients/${patientId}/treatment-plans`),
  get: (id: string) => apiFetch<TreatmentPlan>(`/treatment-plans/${id}`),
  create: (patientId: string, dto: { title?: string; notes?: string; items?: NewPlanItem[] }) =>
    apiFetch<TreatmentPlan>(`/patients/${patientId}/treatment-plans`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (
    id: string,
    dto: Partial<Pick<TreatmentPlan, 'title' | 'status' | 'notes' | 'insuranceEstimateCents'>>,
  ) =>
    apiFetch<TreatmentPlan>(`/treatment-plans/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  accept: (id: string) =>
    apiFetch<TreatmentPlan>(`/treatment-plans/${id}/accept`, { method: 'POST' }),
  addItem: (planId: string, dto: NewPlanItem) =>
    apiFetch<TreatmentPlanItem>(`/treatment-plans/${planId}/items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateItem: (itemId: string, dto: Partial<TreatmentPlanItem>) =>
    apiFetch<TreatmentPlanItem>(`/treatment-plan-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  deleteItem: (itemId: string) =>
    apiFetch<void>(`/treatment-plan-items/${itemId}`, { method: 'DELETE' }),
};

export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
