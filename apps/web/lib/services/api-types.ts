/**
 * API Service Types
 * Type definitions for backend service contracts
 */

// ============================================================================
// KB Service (Knowledge Base / Patient Records)
// ============================================================================

export interface PatientSummary {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  phone: string;
  email: string;
  last_visit_date?: string;
  next_appointment_date?: string;
  flags: {
    has_allergies: boolean;
    requires_pre_medication: boolean;
    has_outstanding_balance: boolean;
  };
}

export interface InsuranceDetails {
  provider: string;
  plan: string;
  coverage_percent: number;
  member_id: string; // Masked by default: ****1234
  group_number?: string;
  policy_expiry?: string;
  annual_max_used: number;
  annual_max_total: number;
  deductible_met: number;
  deductible_total: number;
}

export interface PeriodontalChartingData {
  last_exam: string; // ISO date
  pocket_depths_summary: {
    max_mm: number;
    sites_5mm_plus: number;
    avg_depth_mm: number;
  };
  bleeding_on_probing_percent: number;
  recession_present: boolean;
  mobility_present: boolean;
  full_chart_available: boolean;
}

export interface DentalRecord {
  tooth_number: number;
  status: 'healthy' | 'filling' | 'crown' | 'missing' | 'implant' | 'root_canal';
  surface_conditions?: string[];
  notes?: string;
}

export interface XRayImage {
  id: string;
  type: 'bitewing' | 'periapical' | 'panoramic' | 'cbct';
  date: string;
  tooth_numbers?: number[];
  signed_url: string; // Pre-signed URL (expires)
  thumbnail_url: string;
  findings?: string;
  uploaded_by: string;
}

export interface VisitRecord {
  id: string;
  date: string;
  provider: string;
  reason: string;
  procedures: Array<{
    code: string;
    name: string;
    cost: number;
  }>;
  total_cost: number;
  insurance_paid: number;
  patient_paid: number;
  payment_method?: string;
  notes?: string;
}

export interface DoctorNote {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  text: string;
  visibility: 'doctor' | 'staff' | 'patient';
  version: number;
}

// ============================================================================
// Booking Service (Appointments)
// ============================================================================

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  start: string; // ISO 8601 with timezone
  end: string;
  procedure_code: string;
  procedure_name: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  source: 'ai' | 'manual' | 'rescheduled';
  booking_channel?: 'voice' | 'sms' | 'web' | 'staff' | 'web_chat' | 'phone' | 'in_person';
  ai_confidence_score?: number;
  estimated_cost?: number;
  insurance_coverage_estimate?: number;
  patient_cost_estimate?: number;
  confirmation_timestamp?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  reschedule_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  patient_id: string;
  doctor_id: string;
  start: string;
  end: string;
  procedure_code: string;
  source: 'ai' | 'manual' | 'rescheduled';
  booking_channel?: string;
  ai_confidence_score?: number;
  notes?: string;
  idempotency_key: string;
}

export interface UpdateAppointmentRequest {
  start?: string;
  end?: string;
  doctor_id?: string;
  status?: Appointment['status'];
  notes?: string;
  reschedule_reason?: string;
  cancellation_reason?: string;
}

export interface CoverageEstimate {
  procedure_code: string;
  procedure_name: string;
  total_cost: number;
  insurance_covers: number;
  patient_pays: number;
  coverage_percent: number;
  deductible_applies: boolean;
  requires_pre_auth: boolean;
}

// ============================================================================
// Telephony Gateway (VoIP)
// ============================================================================

export interface CallRecord {
  call_id: string;
  patient_id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  agent: 'human' | 'ai';
  agent_id?: string;
  agent_name?: string;
  duration_sec: number;
  status: 'completed' | 'missed' | 'busy' | 'failed' | 'no_answer' | 'voicemail';
  summary?: string;
  transcript_available: boolean;
  recording_url?: string; // Signed URL
  consent_to_record: boolean;
  created_at: string;
  started_at?: string; // Demo field
  ended_at?: string; // Demo field
  from?: string; // Demo field (legacy)
  to?: string; // Demo field (legacy)
  metadata?: Record<string, any>;
}

export interface InitiateCallRequest {
  patient_id: string;
  to: string; // E.164 format: +16195551701
  from: string;
  record: boolean;
  metadata?: Record<string, any>;
}

export interface CallTranscript {
  call_id: string;
  segments: Array<{
    speaker: 'agent' | 'patient';
    text: string;
    timestamp_sec: number;
    timestamp?: number; // Demo field (legacy)
    confidence: number;
  }>;
  summary: string;
  key_points: string[];
  action_items: string[];
}

// ============================================================================
// Voice Brain (AI + Messaging)
// ============================================================================

export interface Conversation {
  conversation_id: string;
  patient_id: string;
  patient_name: string;
  channel: 'sms' | 'voice' | 'web_chat' | 'email';
  status: 'open' | 'resolved' | 'escalated' | 'snoozed';
  last_message_at: string;
  unread_count: number;
  assigned_to?: string;
  assigned_to_name?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender: 'staff' | 'ai' | 'patient';
  sender_id?: string;
  sender_name?: string;
  text: string;
  attachments?: Array<{
    id: string;
    type: 'image' | 'document' | 'audio';
    url: string;
    filename: string;
  }>;
  timestamp: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  conversation_id: string;
  text: string;
  attachments?: Array<{
    type: string;
    url: string;
    filename: string;
  }>;
}

export interface ConvertToAppointmentRequest {
  conversation_id: string;
  message_id: string;
  suggested_datetime: string;
  procedure_code: string;
  notes?: string;
}

// ============================================================================
// WebSocket Events
// ============================================================================

export type WebSocketEvent =
  | { type: 'calendar_appointment_changed'; data: { appointment: Appointment; change_type: 'created' | 'updated' | 'deleted' } }
  | { type: 'message_received'; data: { conversation_id: string; message: Message } }
  | { type: 'conversation_status_changed'; data: { conversation_id: string; status: Conversation['status'] } }
  | { type: 'patient_notes_updated'; data: { patient_id: string; note: DoctorNote } }
  | { type: 'new_xray_uploaded'; data: { patient_id: string; xray: XRayImage } }
  | { type: 'call_completed'; data: { call_id: string; patient_id: string; call: CallRecord } };

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface APIResponse<T> {
  data: T;
  request_id: string;
  timestamp: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  request_id: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  request_id: string;
}
