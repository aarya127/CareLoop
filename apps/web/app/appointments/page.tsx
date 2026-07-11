'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  appointmentsApi,
  formatApptDate,
  formatSlotTime,
  STATUS_LABELS,
  type AppointmentRecord,
} from '@/lib/api/appointments';
import {
  remindersApi,
  type Reminder,
  REMINDER_STATUS_LABELS,
  REMINDER_STATUS_COLORS,
} from '@/lib/api/reminders';
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal';

// ── Demo / dev constants ────────────────────────────────────────────────────
const DEMO_PRACTICE_ID = process.env.NEXT_PUBLIC_DEMO_PRACTICE_ID ?? '';
const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '';

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    no_show: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Reminder status badge ────────────────────────────────────────────────────
function ReminderBadge({
  reminder,
  onSendNow,
  sending,
}: {
  reminder: Reminder | null;
  onSendNow: () => void;
  sending: boolean;
}) {
  if (!reminder) {
    return (
      <button
        onClick={onSendNow}
        disabled={sending}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send now'}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          REMINDER_STATUS_COLORS[reminder.status]
        }`}
        title={reminder.failReason ?? undefined}
      >
        {REMINDER_STATUS_LABELS[reminder.status]}
      </span>
      {reminder.status === 'failed' && (
        <button
          onClick={onSendNow}
          disabled={sending}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {sending ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // reminder state: appointmentId → most recent Reminder
  const [reminders, setReminders] = useState<Map<string, Reminder>>(new Map());
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const loadReminders = useCallback(async (appts: AppointmentRecord[]) => {
    const entries = await Promise.all(
      appts
        .filter((a) => a.status !== 'cancelled')
        .map(async (a) => {
          try {
            const list = await remindersApi.forAppointment(a.id);
            // Most recent reminder for this appointment
            const latest = list.sort(
              (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
            )[0];
            return [a.id, latest] as const;
          } catch {
            return null;
          }
        }),
    );
    const map = new Map<string, Reminder>();
    for (const entry of entries) {
      if (entry?.[1]) map.set(entry[0], entry[1]);
    }
    setReminders(map);
  }, []);

  function refresh() {
    if (!DEMO_PRACTICE_ID) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 60);

    appointmentsApi
      .list({
        practiceId: DEMO_PRACTICE_ID,
        from: from.toISOString(),
        to: to.toISOString(),
      })
      .then(async (appts) => {
        setAppointments(appts);
        await loadReminders(appts);
      })
      .catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCancel(appt: AppointmentRecord) {
    if (!confirm(`Cancel "${appt.title}"?`)) return;
    setCancellingId(appt.id);
    try {
      await appointmentsApi.cancel(appt.id, 'Cancelled by staff');
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: 'cancelled' } : a)),
      );
    } catch {
      alert('Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  }

  async function handleSendReminder(appt: AppointmentRecord) {
    const existing = reminders.get(appt.id);
    setSendingReminderId(appt.id);
    try {
      if (existing && existing.status === 'failed') {
        // Retry via sendNow
        const updated = await remindersApi.sendNow(existing.id);
        if (updated) setReminders((m) => new Map(m).set(appt.id, updated));
      } else {
        // Schedule + send immediately
        const reminder = await remindersApi.schedule({
          practiceId: DEMO_PRACTICE_ID,
          patientId: (appt as any).patientId ?? '',
          appointmentId: appt.id,
          channel: 'sms',
          type: 'appointment_reminder',
          to: (appt as any).patientPhone ?? '',
          body: `Reminder: You have an appointment "${appt.title}" on ${formatApptDate(appt.start)} at ${formatSlotTime(appt.start)}.`,
          scheduledAt: new Date().toISOString(),
        });
        setReminders((m) => new Map(m).set(appt.id, reminder));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send reminder');
    } finally {
      setSendingReminderId(null);
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Upcoming and recent appointments</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Appointment</Button>
      </div>

      {!DEMO_PRACTICE_ID && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3 mb-4">
          Set <code>NEXT_PUBLIC_DEMO_PRACTICE_ID</code> and <code>NEXT_PUBLIC_DEMO_USER_ID</code> in
          your .env to connect to the real API.
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : appointments.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">No appointments found</p>
          <p className="text-sm mt-1">
            Click <strong>+ New Appointment</strong> to schedule one.
          </p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Reminder</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{appt.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatApptDate(appt.start)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatSlotTime(appt.start)} – {formatSlotTime(appt.end)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{appt.source}</td>
                  <td className="px-4 py-3">
                    {appt.status !== 'cancelled' && appt.status !== 'completed' ? (
                      <ReminderBadge
                        reminder={reminders.get(appt.id) ?? null}
                        onSendNow={() => handleSendReminder(appt)}
                        sending={sendingReminderId === appt.id}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={cancellingId === appt.id}
                        onClick={() => handleCancel(appt)}
                      >
                        {cancellingId === appt.id ? '…' : 'Cancel'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AppointmentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        practiceId={DEMO_PRACTICE_ID}
        userId={DEMO_USER_ID}
        onCreated={(appt) => {
          setAppointments((prev) => [appt, ...prev]);
          setModalOpen(false);
        }}
      />
    </main>
  );
}
