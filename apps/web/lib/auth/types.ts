/**
 * Authentication & Authorization Types
 * JWT-based auth with scoped permissions for RBAC
 */

// Permission scopes
export type AuthScope = 
  | 'PATIENT_READ'
  | 'PATIENT_WRITE'
  | 'APPT_READ'
  | 'APPT_WRITE'
  | 'COMMS_READ'
  | 'COMMS_WRITE'
  | 'VOIP_CALL'
  | 'VOIP_RECORD'
  | 'AUDIT_READ'
  | 'ADMIN_ACCESS'
  | 'PII_REVEAL';

// User roles
export type UserRole = 'admin' | 'doctor' | 'hygienist' | 'receptionist' | 'billing';

// User session
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  scopes: AuthScope[];
  assignedPatientIds?: string[]; // For doctors - only their patients
  practiceId: string;
  profilePictureUrl?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// JWT token payload
export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  scopes: AuthScope[];
  practice_id: string;
  assigned_patient_ids?: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

// Auth context
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasScope: (scope: AuthScope) => boolean;
  hasAnyScope: (scopes: AuthScope[]) => boolean;
  hasAllScopes: (scopes: AuthScope[]) => boolean;
  canAccessPatient: (patientId: string) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Role-based scope mappings
export const ROLE_SCOPES: Record<UserRole, AuthScope[]> = {
  admin: [
    'PATIENT_READ',
    'PATIENT_WRITE',
    'APPT_READ',
    'APPT_WRITE',
    'COMMS_READ',
    'COMMS_WRITE',
    'VOIP_CALL',
    'VOIP_RECORD',
    'AUDIT_READ',
    'ADMIN_ACCESS',
    'PII_REVEAL',
  ],
  doctor: [
    'PATIENT_READ',
    'PATIENT_WRITE',
    'APPT_READ',
    'APPT_WRITE',
    'COMMS_READ',
    'COMMS_WRITE',
    'VOIP_CALL',
    'VOIP_RECORD',
    'PII_REVEAL',
  ],
  hygienist: [
    'PATIENT_READ',
    'APPT_READ',
    'APPT_WRITE',
    'COMMS_READ',
    'COMMS_WRITE',
    'VOIP_CALL',
  ],
  receptionist: [
    'PATIENT_READ',
    'APPT_READ',
    'APPT_WRITE',
    'COMMS_READ',
    'COMMS_WRITE',
    'VOIP_CALL',
    'VOIP_RECORD',
  ],
  billing: [
    'PATIENT_READ',
    'APPT_READ',
    'PII_REVEAL',
  ],
};
