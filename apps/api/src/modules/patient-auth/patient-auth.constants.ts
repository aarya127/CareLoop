// Kept separate from ../auth/auth.constants.ts so tuning patient-portal limits
// can never accidentally affect staff auth.
export const PATIENT_SESSION_COOKIE = 'cl_patient_session';

export const PATIENT_AUTH_LIMITS = {
  LOGIN_ACCOUNT_MAX_ATTEMPTS: 5,
  LOGIN_ACCOUNT_LOCK_MS: 15 * 60 * 1000,
} as const;

export const PATIENT_AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_LOCKED: 'Account temporarily locked',
} as const;

export const PATIENT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
