'use client';

import { useState, useEffect } from 'react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export function usePatient(patientId: string | null) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetch(`/api/patients/${patientId}`)
      .then((r) => r.json())
      .then(setPatient)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [patientId]);

  return { patient, loading, error };
}
