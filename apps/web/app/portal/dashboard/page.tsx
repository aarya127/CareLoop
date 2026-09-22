'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePatientAuth } from '@/lib/patient-auth/patient-auth-context';

// Placeholder — real patient-facing data views (appointments, documents,
// billing) are out of scope for v1. This page exists so the login/invite
// flows have somewhere to land and to prove the session round-trip works.
export default function PatientPortalDashboardPage() {
  const { patient, isAuthenticated, isLoading, logout } = usePatientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/portal/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {patient.firstName || patient.email}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your patient portal account is set up. Appointment, document, and billing views are coming
          soon.
        </p>
        <button
          onClick={() => {
            logout();
            router.push('/portal/login');
          }}
          className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
