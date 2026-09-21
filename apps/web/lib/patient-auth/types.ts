// Deliberately separate from lib/auth/types.ts — a patient is never a UserRole,
// and this type must never be assignable where an AuthUser is expected.
export interface PatientPortalUser {
  id: string;
  patientId: string;
  practiceId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface PatientAuthContextValue {
  patient: PatientPortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
