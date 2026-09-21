// Separate from lib/auth/cookies.ts on purpose — the patient portal never shares
// a cookie name with staff auth. Must match the API's PATIENT_SESSION_COOKIE.
export const PATIENT_SESSION_COOKIE = 'cl_patient_session';
