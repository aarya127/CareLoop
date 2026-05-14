const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://careloop-tf2l.onrender.com';

export interface AppointmentRecord {
  id: string;
  practiceId: string;
  userId: string;
  providerId: string;
  patientId?: string | null;
  roomId?: string | null;
  title: string;
  notes?: string | null;
  start: string;
  end: string;
  timeZone: string;
  status: string;
  source: string;
  procedureCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface CreateAppointmentInput {
  practiceId: string;
  userId: string;
  providerId: string;
  patientId?: string;
  roomId?: string;
  title?: string;
  start: string;
  end: string;
  timeZone?: string;
  notes?: string;
  procedureCode?: string;
  source?: string;
}

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
  return res.json() as Promise<T>;
}

export const appointmentsApi = {
  list(params: {
    practiceId: string;
    providerId?: string;
    patientId?: string;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<AppointmentRecord[]> {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      ) as Record<string, string>,
    );
    return apiFetch<AppointmentRecord[]>(`/appointments?${q}`);
  },

  getById(id: string): Promise<AppointmentRecord> {
    return apiFetch<AppointmentRecord>(`/appointments/${id}`);
  },

  create(dto: CreateAppointmentInput, idempotencyKey?: string): Promise<AppointmentRecord> {
    return apiFetch<AppointmentRecord>('/appointments', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    });
  },

  reschedule(
    id: string,
    dto: { start: string; end: string; reason?: string },
  ): Promise<AppointmentRecord> {
    return apiFetch<AppointmentRecord>(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  cancel(id: string, reason?: string): Promise<AppointmentRecord> {
    return apiFetch<AppointmentRecord>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  getSlots(params: {
    practiceId: string;
    providerId: string;
    date: string;      // YYYY-MM-DD
    duration: number;  // minutes
  }): Promise<TimeSlot[]> {
    const q = new URLSearchParams({
      practiceId: params.practiceId,
      providerId: params.providerId,
      date: params.date,
      duration: String(params.duration),
    });
    return apiFetch<TimeSlot[]>(`/appointments/availability?${q}`);
  },
};

// ── Formatting helpers ───────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
};

export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatApptDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
