'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { PatientAuthContextValue, PatientPortalUser } from './types';

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<PatientPortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/patient-portal/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Patient portal auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await fetch('/api/patient-portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let message = `Login failed (${res.status})`;
      try {
        const errBody = await res.json();
        if (errBody?.error) message = String(errBody.error);
      } catch {
        // non-JSON error body; keep the status-based message
      }
      throw new Error(message);
    }

    const data = await res.json();
    setPatient(data.patient);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/patient-portal/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // best-effort
    }
    setPatient(null);
  }, []);

  const value: PatientAuthContextValue = {
    patient,
    isAuthenticated: !!patient,
    isLoading,
    login,
    logout,
  };

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error('usePatientAuth must be used within PatientAuthProvider');
  }
  return context;
}
