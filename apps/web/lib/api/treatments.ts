import { PUBLIC_API_URL as BASE } from '../config/api-client';
import { ApiError } from '../http/api-error';

export interface TreatmentRecord {
  id: string;
  practiceId: string;
  patientId: string;
  appointmentId?: string | null;
  providerId?: string | null;
  procedureCode?: string | null;
  toothNumber?: number | null;
  surface?: string | null;
  notes?: string | null;
  status: string; // planned | in_progress | completed | cancelled
  completedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  provider?: { id: string; name: string; specialty: string } | null;
}

// Tenant and actor come from the session server-side; never sent from the browser.
export interface CreateTreatmentInput {
  patientId: string;
  appointmentId?: string;
  providerId?: string;
  procedureCode?: string;
  toothNumber?: number;
  surface?: string;
  notes?: string;
  status?: string;
}

export interface UpdateTreatmentInput {
  appointmentId?: string;
  providerId?: string;
  procedureCode?: string;
  toothNumber?: number;
  surface?: string;
  notes?: string;
  status?: string;
  completedAt?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(`API ${path} → ${res.status}: ${text}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const treatmentsApi = {
  list(params: {
    patientId?: string;
    providerId?: string;
    appointmentId?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<TreatmentRecord[]> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    return apiFetch<TreatmentRecord[]>(`/treatments?${q}`);
  },

  getById(id: string): Promise<TreatmentRecord> {
    return apiFetch<TreatmentRecord>(`/treatments/${id}`);
  },

  create(dto: CreateTreatmentInput): Promise<TreatmentRecord> {
    return apiFetch<TreatmentRecord>('/treatments', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  update(id: string, dto: UpdateTreatmentInput): Promise<TreatmentRecord> {
    return apiFetch<TreatmentRecord>(`/treatments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/treatments/${id}`, { method: 'DELETE' });
  },
};
