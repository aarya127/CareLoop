// API Base Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:3001';

// API Endpoints
export const ENDPOINTS = {
  // Insights & KPIs
  INSIGHTS_TODAY: '/insights/today',
  INSIGHTS_TRENDS: '/insights/trends',
  
  // Queue & Actions
  QUEUE_ACTIONS: '/queue/actions',
  
  // Calls
  CALLS_RECENT: '/calls/recent',
  CALLS_LOGS: '/calls/logs',
  CALL_DETAILS: (id: string) => `/calls/${id}`,
  CALL_RECORDING: (id: string) => `/calls/${id}/recording`,
  
  // Patients
  PATIENTS_RECENT: '/patients/recent',
  PATIENTS_SEARCH: '/patients/search',
  PATIENT_DETAILS: (id: string) => `/patients/${id}`,
  PATIENT_SUMMARY: (id: string) => `/patients/${id}/summary`,
  
  // Insurance
  INSURANCE_ELIGIBILITY: (patientId: string) => `/insurance/${patientId}/eligibility`,
  INSURANCE_COVERAGE: (patientId: string) => `/insurance/${patientId}/coverage`,
  
  // Calendar & Appointments
  CALENDAR: '/calendar',
  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAILS: (id: string) => `/appointments/${id}`,
  AVAILABILITY: '/appointments/availability',
  
  // Providers & Resources
  PROVIDERS: '/providers',
  ROOMS: '/rooms',
  
  // Billing
  PATIENT_BALANCE: (patientId: string) => `/billing/${patientId}/balance`,
  PAYMENT_HISTORY: (patientId: string) => `/billing/${patientId}/payments`,
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CALL_STARTED: 'CALL_STARTED',
  CALL_ENDED: 'CALL_ENDED',
  INTENT_APPOINTMENT_BOOK: 'INTENT_APPOINTMENT_BOOK',
  INSURANCE_VERIFY_REQUEST: 'INSURANCE_VERIFY_REQUEST',
  CALL_SUMMARY_READY: 'CALL_SUMMARY_READY',
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED: 'APPOINTMENT_UPDATED',
} as const;
