export type MessageChannel = 'sms' | 'email';

export interface SendMessageDto {
  practiceId: string;
  patientId: string;
  channel: MessageChannel;
  to: string;             // E.164 phone or email address
  subject?: string;       // required for email
  body: string;           // SMS text or HTML email body
  reminderId?: string;    // optional — link to Reminder row for status update
}

export interface ScheduleReminderDto {
  practiceId: string;
  patientId: string;
  appointmentId?: string;
  channel: MessageChannel;
  type: string;           // appointment_reminder | recall | payment_due
  to: string;
  subject?: string;
  body: string;
  scheduledAt: string;    // ISO-8601
  metadata?: Record<string, unknown>;
}

export interface ConversationEntry {
  id: string;
  channel: string;
  type: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  metadata?: unknown;
}
