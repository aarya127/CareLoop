// Auth & RBAC
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

export type UserRole = 'admin' | 'doctor' | 'hygienist' | 'receptionist' | 'billing';

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  scopes: AuthScope[];
  practice_id: string;
  assigned_patient_ids?: string[];
  iat: number;
  exp: number;
  jti: string;
}

// Appointment
export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentSource = 'manual' | 'ai' | 'rescheduled';

export interface AppointmentSlot {
  start: string; // ISO8601
  end: string;
  providerId: string;
  roomId?: string;
}

// Patient
export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneE164: string;
  practiceId: string;
}

// Analytics
export type KpiMetricName =
  | 'avg_sentiment'
  | 'treatment_acceptance_rate'
  | 'call_volume'
  | 'handoff_rate';

export interface KpiDataPoint {
  date: string;
  metricName: KpiMetricName;
  value: number;
}

// Jobs (BullMQ queues)
export type JobName =
  | 'finalize-transcript'
  | 'sync-google-calendar'
  | 'send-appointment-reminder'
  | 'compute-kpis'
  | 'send-notification';

export interface FinalizeTranscriptJobData {
  transcriptId: string;
  practiceId: string;
}

export interface SyncGoogleCalendarJobData {
  practiceId: string;
  userId: string;
  calendarId: string;
}

export interface AppointmentReminderJobData {
  appointmentId: string;
  patientId: string;
  reminderType: 'sms' | 'email';
}

export interface ComputeKpisJobData {
  practiceId: string;
  date: string; // YYYY-MM-DD
}

// Health check
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  services: {
    database: 'ok' | 'down';
    redis: 'ok' | 'down';
  };
  version: string;
  uptime: number;
  timestamp: string;
}
