'use client';

import { useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export interface AppointmentEvent {
  type: 'created' | 'cancelled' | 'rescheduled';
  id: string;
  practiceId: string;
  providerId: string;
  patientId: string | null;
  title: string;
  start: string;
  end: string;
  status: string;
  source: string;
  ts: number;
}

/**
 * Subscribe to live appointment changes for a practice via Server-Sent Events.
 *
 * The browser's native EventSource API is used — no library required.
 * EventSource automatically reconnects after connection drops.
 * Cookies are sent with `withCredentials: true` so session auth applies.
 *
 * @param practiceId - Subscribe only when set (avoids connecting before auth)
 * @param onEvent    - Called for every appointment mutation received.
 *                     Stabilise with useCallback to avoid re-subscribing on every render.
 */
export function useAppointmentEvents(
  practiceId: string | undefined,
  onEvent: (event: AppointmentEvent) => void,
): void {
  useEffect(() => {
    if (!practiceId) return;

    const url = `${API_BASE}/appointments/events?practiceId=${encodeURIComponent(practiceId)}`;
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as AppointmentEvent;
        onEvent(event);
      } catch {
        // Heartbeat comments (": heartbeat") are not dispatched as messages —
        // only malformed JSON payloads would land here; safe to ignore.
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically — no action needed.
    };

    return () => es.close();
  }, [practiceId]); // onEvent intentionally excluded: callers must stabilise with useCallback
}
