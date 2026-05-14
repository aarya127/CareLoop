export const APP_NAME = 'CareLoop';
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT: (id: string) => `/patients/${id}`,
  PATIENT_APPOINTMENTS: (id: string) => `/patients/${id}/appointments`,
  PATIENT_TREATMENTS: (id: string) => `/patients/${id}/treatments`,
  PATIENT_INSURANCE: (id: string) => `/patients/${id}/insurance`,
  PATIENT_BILLING: (id: string) => `/patients/${id}/billing`,
  PATIENT_DOCUMENTS: (id: string) => `/patients/${id}/documents`,
  APPOINTMENTS: '/appointments',
  INTAKE: '/intake',
  INTAKE_FORM: (id: string) => `/intake/${id}`,
  ANALYTICS: '/analytics',
  AUDIT: '/audit',
  SETTINGS: '/settings',
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const PATIENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
