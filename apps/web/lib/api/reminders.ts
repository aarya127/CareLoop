const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://careloop-tf2l.onrender.com';

export type ReminderChannel = 'sms' | 'email' | 'push';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Reminder {
  id: string;
  practiceId: string;
  patientId: string;
  appointmentId?: string | null;
  channel: ReminderChannel;
  type: string;
  status: ReminderStatus;
  scheduledAt: string;
  sentAt?: string | null;
  failReason?: string | null;
  retryCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleReminderInput {
  practiceId: string;
  patientId: string;
  appointmentId?: string;
  channel: ReminderChannel;
  type: string;
  to: string;
  subject?: string;
  body: string;
  scheduledAt: string;
  metadata?: Record<string, unknown>;
}

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Scheduled',
  sent: 'Sent',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const REMINDER_STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const remindersApi = {
  forAppointment: (appointmentId: string) =>
    apiFetch<Reminder[]>(`/reminders/appointment/${appointmentId}`),

  history: (params: {
    practiceId: string;
    patientId?: string;
    channel?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<
        string,
        string
      >,
    );
    return apiFetch<Reminder[]>(`/reminders/history?${qs}`);
  },

  schedule: (dto: ScheduleReminderInput) =>
    apiFetch<Reminder>('/messaging/reminders/schedule', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  sendNow: (id: string) => apiFetch<Reminder>(`/reminders/${id}/send`, { method: 'POST' }),

  cancel: (id: string) => apiFetch<Reminder>(`/reminders/${id}/cancel`, { method: 'PATCH' }),
};
