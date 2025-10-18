/**
 * Comprehensive Dental Record Type Definitions
 * For premium patient record dashboard with interactive clinical charting
 */

// ============================================================================
// Patient Overview Types
// ============================================================================

export interface PatientProfile {
  patient_id: string;
  profile_photo_url?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date
  age?: number; // Auto-calculated
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contact: PatientContact;
  preferences: PatientPreferences;
  insurance?: InsuranceInfo;
  financial: FinancialInfo;
  next_appointment?: NextAppointment;
}

export interface PatientContact {
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface PatientPreferences {
  preferred_dentist_id?: string;
  preferred_dentist_name?: string;
  preferred_hygienist_id?: string;
  preferred_hygienist_name?: string;
  appointment_reminder_method: 'email' | 'sms' | 'both' | 'none';
  communication_language: string;
}

export interface InsuranceInfo {
  provider_name: string;
  coverage_type: 'private' | 'government' | 'none';
  coverage_percent: number; // 0-100
  policy_number: string;
  plan_id: string;
  group_number?: string;
  subscriber_name?: string;
  subscriber_dob?: string;
  insurance_card_front_url?: string;
  insurance_card_back_url?: string;
  effective_date: string;
  expiry_date?: string;
}

export interface FinancialInfo {
  outstanding_balance: number;
  total_lifetime_spent: number;
  average_visit_cost: number;
  payment_plan_active: boolean;
  payment_plan_details?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
}

export interface NextAppointment {
  appointment_id: string;
  date: string; // ISO datetime
  time: string;
  procedure_type: string;
  dentist_name: string;
  status: 'scheduled' | 'confirmed' | 'pending';
}

// ============================================================================
// Medical & Dental History Types
// ============================================================================

export interface MedicalHistory {
  patient_id: string;
  allergies: Allergy[];
  current_medications: Medication[];
  systemic_conditions: SystemicCondition[];
  past_surgeries: Surgery[];
  lifestyle_factors: LifestyleFactors;
  family_health_history: FamilyHealthHistory[];
  dental_history: DentalHistory;
}

export interface Allergy {
  id: string;
  allergen: string; // "penicillin", "latex", "local anesthetic", etc.
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string; // "rash", "anaphylaxis", etc.
  notes?: string;
  date_identified: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  start_date: string;
  end_date?: string;
  prescribing_doctor?: string;
  notes?: string;
}

export interface SystemicCondition {
  id: string;
  condition: string; // "diabetes", "hypertension", "osteoporosis", etc.
  diagnosed_date: string;
  status: 'active' | 'controlled' | 'resolved';
  severity: 'mild' | 'moderate' | 'severe';
  treatment?: string;
  notes?: string;
}

export interface Surgery {
  id: string;
  procedure: string;
  date: string;
  hospital?: string;
  surgeon?: string;
  complications?: string;
  dental_implants?: boolean;
  notes?: string;
}

export interface LifestyleFactors {
  smoking: {
    status: 'never' | 'former' | 'current';
    packs_per_day?: number;
    years?: number;
    quit_date?: string;
  };
  alcohol: {
    frequency: 'never' | 'occasional' | 'moderate' | 'heavy';
    drinks_per_week?: number;
  };
  diet_notes?: string;
  exercise_frequency?: string;
}

export interface FamilyHealthHistory {
  id: string;
  relation: string; // "mother", "father", "sibling", etc.
  conditions: string[]; // ["diabetes", "heart disease", "periodontal disease"]
}

export interface DentalHistory {
  last_cleaning_date?: string;
  last_exam_date?: string;
  previous_orthodontics: boolean;
  orthodontics_details?: string;
  previous_implants: boolean;
  implant_details?: string;
  dental_anxiety_level: 'none' | 'mild' | 'moderate' | 'severe';
  previous_complications?: string;
  treatment_history_summary: TreatmentHistoryEntry[];
}

export interface TreatmentHistoryEntry {
  id: string;
  date: string;
  procedure: string;
  teeth_involved: number[];
  dentist_name: string;
  notes?: string;
  cost?: number;
  insurance_covered?: number;
}

// ============================================================================
// Clinical Charting Types
// ============================================================================

export interface ClinicalChart {
  patient_id: string;
  last_updated: string;
  teeth: ToothRecord[];
  gum_health_summary: GumHealthSummary;
  treatment_plans: TreatmentPlan[];
  ai_suggestions?: AISuggestion[];
}

export interface ToothRecord {
  tooth_number: number; // 1-32 (Universal numbering)
  tooth_name?: string; // "Upper Right Third Molar"
  status: 'healthy' | 'decayed' | 'filled' | 'crowned' | 'missing' | 'implant' | 'bridge' | 'root_canal';
  condition_details?: ToothCondition[];
  surfaces_affected?: ToothSurface[];
  treatment_recommended?: string;
  urgency?: 'routine' | 'soon' | 'urgent' | 'emergency';
  notes?: string;
  color_code: string; // Hex color for visualization
  last_treated_date?: string;
}

export interface ToothCondition {
  condition_type: 'cavity' | 'filling' | 'crown' | 'fracture' | 'wear' | 'stain' | 'calculus';
  severity: 'mild' | 'moderate' | 'severe';
  surface: ToothSurface;
  notes?: string;
}

export type ToothSurface = 
  | 'occlusal'      // Biting surface
  | 'mesial'        // Front surface (toward midline)
  | 'distal'        // Back surface (away from midline)
  | 'buccal'        // Cheek side
  | 'lingual'       // Tongue side
  | 'facial'        // Face side
  | 'incisal';      // Edge (for front teeth)

export interface GumHealthSummary {
  overall_health: 'excellent' | 'good' | 'fair' | 'poor';
  periodontal_diagnosis?: string;
  bleeding_on_probing: boolean;
  pocket_depths_average: number; // mm
  bone_loss_detected: boolean;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  created_date: string;
  status: 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'declined';
  procedures: PlannedProcedure[];
  total_estimated_cost: number;
  insurance_coverage_estimated: number;
  patient_responsibility: number;
  priority: 'routine' | 'recommended' | 'necessary' | 'urgent';
  notes?: string;
}

export interface PlannedProcedure {
  id: string;
  procedure_name: string;
  procedure_code?: string; // ADA code
  teeth_involved: number[];
  estimated_cost: number;
  estimated_duration_minutes: number;
  scheduled_date?: string;
  completed: boolean;
  notes?: string;
}

export interface AISuggestion {
  id: string;
  suggestion_type: 'treatment' | 'diagnosis' | 'prevention';
  message: string;
  confidence_score: number; // 0-100
  teeth_involved?: number[];
  recommended_action: string;
  reasoning: string;
  created_date: string;
}

// ============================================================================
// Radiographic & Diagnostic Files Types
// ============================================================================

export interface RadiographicRecords {
  patient_id: string;
  xrays: XRayRecord[];
  intraoral_photos: IntraoralPhoto[];
  diagnostic_scans: DiagnosticScan[];
}

export interface XRayRecord {
  id: string;
  type: 'bitewing' | 'periapical' | 'panoramic' | 'cbct' | 'occlusal' | 'cephalometric';
  date_taken: string;
  image_url: string;
  thumbnail_url: string;
  teeth_visible: number[];
  dentist_findings: string;
  ai_analysis?: AIAnalysis;
  quality_rating?: 'excellent' | 'good' | 'acceptable' | 'poor';
  notes?: string;
  taken_by?: string;
}

export interface IntraoralPhoto {
  id: string;
  type: 'frontal' | 'lateral' | 'occlusal' | 'close_up';
  date_taken: string;
  image_url: string;
  thumbnail_url: string;
  teeth_visible?: number[];
  description: string;
  notes?: string;
}

export interface DiagnosticScan {
  id: string;
  scan_type: '3d_model' | 'bite_registration' | 'impression' | 'cbct_3d';
  date_taken: string;
  file_url: string;
  file_format: 'stl' | 'ply' | 'obj' | 'dicom';
  purpose: string;
  findings?: string;
  notes?: string;
}

export interface AIAnalysis {
  analysis_id: string;
  analysis_date: string;
  detections: AIDetection[];
  confidence_score: number; // 0-100
  summary: string;
  recommendations?: string[];
}

export interface AIDetection {
  detection_type: 'cavity' | 'bone_loss' | 'calculus' | 'periapical_lesion' | 'impacted_tooth';
  location: {
    tooth_number?: number;
    area_description: string;
  };
  confidence: number; // 0-100
  severity: 'mild' | 'moderate' | 'severe';
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ============================================================================
// Periodontal Records Types
// ============================================================================

export interface PeriodontalRecords {
  patient_id: string;
  examinations: PeriodontalExam[];
  summary: PeriodontalSummary;
  treatment_history: PeriodontalTreatment[];
}

export interface PeriodontalExam {
  id: string;
  exam_date: string;
  examiner_name: string;
  measurements: PeriodontalMeasurement[];
  overall_diagnosis: string;
  notes?: string;
}

export interface PeriodontalMeasurement {
  tooth_number: number;
  sites: PeriodontalSite[]; // Usually 6 sites per tooth
  mobility_score?: number; // 0-3
  furcation_involvement?: 'none' | 'grade_1' | 'grade_2' | 'grade_3';
  notes?: string;
}

export interface PeriodontalSite {
  site_position: 'mesial_buccal' | 'mid_buccal' | 'distal_buccal' | 'mesial_lingual' | 'mid_lingual' | 'distal_lingual';
  pocket_depth_mm: number;
  gingival_margin_mm?: number;
  clinical_attachment_level_mm?: number;
  bleeding_on_probing: boolean;
  suppuration: boolean;
  plaque_present: boolean;
}

export interface PeriodontalSummary {
  last_exam_date: string;
  periodontal_status: 'healthy' | 'gingivitis' | 'mild_periodontitis' | 'moderate_periodontitis' | 'severe_periodontitis';
  average_pocket_depth: number;
  percentage_bleeding_sites: number;
  percentage_plaque_sites: number;
  teeth_at_risk: number[];
  recommended_treatment: string;
  recall_interval_months: number;
}

export interface PeriodontalTreatment {
  id: string;
  treatment_date: string;
  treatment_type: 'scaling_root_planing' | 'periodontal_maintenance' | 'gingivectomy' | 'bone_graft' | 'guided_tissue_regeneration';
  teeth_treated: number[];
  provider_name: string;
  outcome_notes?: string;
  follow_up_date?: string;
}

// ============================================================================
// Administrative Documents Types
// ============================================================================

export interface AdministrativeDocuments {
  patient_id: string;
  documents: AdministrativeDocument[];
}

export interface AdministrativeDocument {
  id: string;
  document_type: 
    | 'consent_form'
    | 'treatment_plan'
    | 'invoice'
    | 'insurance_claim'
    | 'medical_history_form'
    | 'hipaa_authorization'
    | 'financial_agreement'
    | 'referral_letter'
    | 'lab_prescription'
    | 'prescription'
    | 'correspondence';
  title: string;
  status: 'pending' | 'signed' | 'approved' | 'rejected' | 'archived' | 'void';
  date_issued: string;
  date_signed?: string;
  file_url: string;
  file_format: 'pdf' | 'jpg' | 'png' | 'docx';
  linked_appointment_id?: string;
  linked_procedure?: string;
  signed_by?: DocumentSignature[];
  notes?: string;
  tags?: string[];
}

export interface DocumentSignature {
  signer_name: string;
  signer_role: 'patient' | 'guardian' | 'dentist' | 'witness';
  signature_image_url?: string;
  signature_date: string;
  ip_address?: string;
}

// ============================================================================
// Activity Timeline Types
// ============================================================================

export interface ActivityTimelineEntry {
  id: string;
  timestamp: string; // ISO datetime
  activity_type: 
    | 'appointment'
    | 'treatment'
    | 'xray_taken'
    | 'document_uploaded'
    | 'payment_received'
    | 'note_added'
    | 'prescription_issued'
    | 'referral_sent'
    | 'record_updated';
  title: string;
  description: string;
  actor_name?: string; // Who performed the action
  actor_role?: 'dentist' | 'hygienist' | 'receptionist' | 'patient' | 'system';
  related_document_id?: string;
  related_appointment_id?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// AI Assistant Types
// ============================================================================

export interface AIAssistantQuery {
  query_type: 'summarize_health' | 'list_unresolved_treatments' | 'predict_next_visit' | 'risk_assessment' | 'custom';
  query_text: string;
  patient_id: string;
}

export interface AIAssistantResponse {
  response_id: string;
  query: string;
  answer: string;
  confidence: number; // 0-100
  data_points_used: string[];
  recommendations?: string[];
  timestamp: string;
}

// ============================================================================
// Complete Patient Dental Record (Composite)
// ============================================================================

export interface CompleteDentalRecord {
  profile: PatientProfile;
  medical_history: MedicalHistory;
  clinical_chart: ClinicalChart;
  radiographic_records: RadiographicRecords;
  periodontal_records: PeriodontalRecords;
  administrative_documents: AdministrativeDocuments;
  activity_timeline: ActivityTimelineEntry[];
  last_updated: string;
  record_version: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface UpdatePatientRequest {
  patient_id: string;
  updates: Partial<PatientProfile>;
}

export interface CreateRecordRequest {
  patient_id: string;
  record_type: 'allergy' | 'medication' | 'treatment' | 'xray' | 'document' | 'periodontal_exam';
  data: any;
}

export interface UploadFileRequest {
  patient_id: string;
  file_type: 'xray' | 'photo' | 'document' | 'scan';
  file: File;
  metadata: {
    title: string;
    description?: string;
    date_taken?: string;
    teeth_involved?: number[];
  };
}

export interface UploadFileResponse {
  file_id: string;
  file_url: string;
  thumbnail_url?: string;
  upload_timestamp: string;
  success: boolean;
  message: string;
}
