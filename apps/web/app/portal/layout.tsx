import { PatientAuthProvider } from '@/lib/patient-auth/patient-auth-context';

// Scoped to /portal only — the staff AuthProvider in the root layout is
// untouched, so the two auth contexts can never leak into each other.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PatientAuthProvider>{children}</PatientAuthProvider>;
}
