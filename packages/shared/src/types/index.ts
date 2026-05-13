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
export type AppointmentStatus =
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentSource = 'manual' | 'ai' | 'rescheduled';

export interface AppointmentSlot {
  start: string;
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

// Insurance
export interface InsurancePlan {
  id: string;
  patientId: string;
  provider: string;
  memberId: string;
  groupNumber?: string;
  isPrimary: boolean;
}

// Billing
export interface InvoiceSummary {
  id: string;
  patientId: string;
  appointmentId?: string;
  amountCents: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  issuedAt: string;
  dueAt: string;
}

// Analytics
export type KpiMetricName =
  | 'avg_sentiment'
  | 'treatment_acceptance_rate'
  | 'call_volume'
  | 'handoff_rate'
  | 'no_show_rate'
  | 'revenue_per_visit';

export interface KpiDataPoint {
  date: string;
  metricName: KpiMetricName;
  value: number;
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

// Jobs (BullMQ)
export const JobNames = {
  FINALIZE_TRANSCRIPT: 'finalize-transcript',
  SYNC_GOOGLE_CALENDAR: 'sync-google-calendar',
  APPOINTMENT_REMINDER: 'send-appointment-reminder',
  COMPUTE_KPIS: 'compute-kpis',
  SEND_NOTIFICATION: 'send-notification',
  DOCUMENT_CLEANUP: 'document-cleanup',
  ANALYTICS_REFRESH: 'analytics-refresh',
  EXPORT_DATA: 'export-data',
  PROCESS_WEBHOOK: 'process-webhook',
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];

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
  practiceId: string;
  reminderId: string;       // links back to Reminder row for status update
  channel: 'sms' | 'email';
  to: string;               // E.164 phone or email address
  reminderType: 'sms' | 'email'; // kept for backward compat with legacy workers
  content: string;          // pre-rendered message body
}

export interface ComputeKpisJobData {
  practiceId: string;
  date: string; // YYYY-MM-DD
}

export interface DocumentCleanupJobData {
  practiceId: string;
  olderThanDays: number;
}

export interface AnalyticsRefreshJobData {
  practiceId: string;
}

export interface ExportDataJobData {
  practiceId: string;
  requestedBy: string;
  format: 'csv' | 'pdf';
  resource: 'patients' | 'appointments' | 'billing';
}

export interface ProcessWebhookJobData {
  provider: string;         // twilio | sendgrid | google_calendar | stripe
  event: string;            // inbound_sms | delivered | calendar_push etc.
  payload: Record<string, unknown>;
  webhookLogId: string;     // FK to WebhookLog for status update
  idempotencyKey: string;   // already claimed in WebhookLog
}

/** Fired by the hourly scheduler to find and enqueue pending reminders. */
export interface ReminderScanJobData {
  /** ISO date string — scan window upper bound. Defaults to now+5min in processor. */
  scanUpTo?: string;
}
