export type IntakeDraftStatus = 'draft' | 'submitted';

export interface DemographicsData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface EmergencyContactData {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface InsuranceData {
  payerName?: string;
  planName?: string;
  memberId?: string;
  groupNumber?: string;
}

export interface IntakeDraftData {
  demographics?: DemographicsData;
  emergencyContact?: EmergencyContactData;
  insurance?: InsuranceData;
  notes?: string;
}

export interface IntakeDraft {
  id: string;
  practiceId: string;
  token: string;
  status: IntakeDraftStatus;
  data: IntakeDraftData;
  patientId?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeSubmitResult {
  patient: { id: string; firstName: string; lastName: string };
  insurance: { id: string } | null;
  submission: { id: string };
}
