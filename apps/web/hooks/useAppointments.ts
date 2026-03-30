'use client';

import { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
}

interface UseAppointmentsOptions {
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (options.patientId) params.set('patientId', options.patientId);
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then(setAppointments)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [options.patientId, options.startDate, options.endDate]);

  return { appointments, loading, error };
}
