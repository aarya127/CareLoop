'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  appointmentsApi,
  formatSlotTime,
  type CreateAppointmentInput,
  type TimeSlot,
} from '@/lib/api/appointments';

interface Provider {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the newly created appointment */
  onCreated?: (appt: any) => void;
  practiceId: string;
  userId: string;       // logged-in staff user
  providers?: Provider[];
  patients?: Patient[];
  /** Pre-fill a patient */
  defaultPatientId?: string;
  /** Pre-fill start date/time (ISO string) */
  defaultStart?: string;
}

const DURATIONS = [15, 30, 45, 60, 90, 120];

// Build a YYYY-MM-DD string from a Date object
function toDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  onCreated,
  practiceId,
  userId,
  providers = [],
  patients = [],
  defaultPatientId,
  defaultStart,
}: AppointmentFormModalProps) {
  const today = toDateInput(new Date());

  // Form fields
  const [providerId, setProviderId] = useState(providers[0]?.id ?? '');
  const [date, setDate] = useState(
    defaultStart ? toDateInput(new Date(defaultStart)) : today,
  );
  const [duration, setDuration] = useState(30);
  const [patientId, setPatientId] = useState(defaultPatientId ?? '');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [procedureCode, setProcedureCode] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Availability
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const iKeyRef = useRef(`appt-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Load slots whenever provider / date / duration change
  useEffect(() => {
    if (!providerId || !date) { setSlots([]); return; }
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    appointmentsApi
      .getSlots({ practiceId, providerId, date, duration })
      .then(setSlots)
      .catch(() => setSlotsError('Could not load availability'))
      .finally(() => setSlotsLoading(false));
  }, [practiceId, providerId, date, duration]);

  // Re-generate idempotency key when modal opens
  useEffect(() => {
    if (isOpen) {
      iKeyRef.current = `appt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setSelectedSlot(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) { setSubmitError('Please select a time slot'); return; }
    setSubmitting(true);
    setSubmitError(null);

    const dto: CreateAppointmentInput = {
      practiceId,
      userId,
      providerId,
      patientId: patientId || undefined,
      title: title || 'Appointment',
      start: selectedSlot.start,
      end: selectedSlot.end,
      notes: notes || undefined,
      procedureCode: procedureCode || undefined,
      source: 'manual',
    };

    try {
      const appt = await appointmentsApi.create(dto, iKeyRef.current);
      onCreated?.(appt);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">New Appointment</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Left — booking parameters */}
            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium mb-1">Provider *</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select provider…</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-1">Duration *</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>

              {/* Patient */}
              {patients.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Patient</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">No patient linked</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  placeholder="Appointment"
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Procedure code */}
              <div>
                <label className="block text-sm font-medium mb-1">Procedure Code</label>
                <input
                  type="text"
                  value={procedureCode}
                  placeholder="e.g. D1110"
                  onChange={(e) => setProcedureCode(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Right — availability table */}
            <div>
              <p className="text-sm font-medium mb-2">
                Available Slots
                {selectedSlot && (
                  <span className="ml-2 text-primary">
                    — {formatSlotTime(selectedSlot.start)}
                  </span>
                )}
              </p>

              {!providerId || !date ? (
                <p className="text-sm text-muted-foreground">
                  Select a provider and date to see availability.
                </p>
              ) : slotsLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading slots…</p>
              ) : slotsError ? (
                <p className="text-sm text-destructive">{slotsError}</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available slots on this date for {duration} min.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {formatSlotTime(slot.start)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 flex items-center justify-between gap-3">
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            <div className="ml-auto flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedSlot}>
                {submitting ? 'Booking…' : 'Book Appointment'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
