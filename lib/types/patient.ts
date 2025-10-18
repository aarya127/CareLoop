// Patient data types for the dental practice dashboard

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: InsuranceInfo;
  allergies: Allergy[];
  preMedicationNotes?: string;
  specialNeeds?: string[];
  medicalConditions?: MedicalCondition[];
  medications?: Medication[];
  dentalRecord?: DentalRecord;
  visits: Visit[];
  billing: BillingInfo;
  avatarUrl?: string;
}

export interface InsuranceInfo {
  provider: string;
  providerLogo?: string;
  planName: string;
  coveragePercent: number;
  memberId: string;
  groupNumber?: string;
  policyExpiry: string;
  relationship: 'self' | 'dependent';
  annualMaximum: number;
  deductible: number;
  deductibleMet: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
}

export interface Allergy {
  id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  dateRecorded: string;
}

export interface MedicalCondition {
  id: string;
  name: string;
  dateDiagnosed: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribingDoctor: string;
  dateStarted: string;
}

export interface DentalRecord {
  problems: DentalProblem[];
  procedures: DentalProcedure[];
  attachments: Attachment[];
}

export interface DentalProblem {
  id: string;
  description: string;
  toothNumber?: number;
  dateIdentified: string;
  status: 'active' | 'resolved';
}

export interface DentalProcedure {
  id: string;
  date: string;
  name: string;
  code: string;
  toothNumbers?: number[];
  provider: string;
  outcome?: string;
  notes?: string;
}

export interface Attachment {
  id: string;
  type: 'xray' | 'photo' | 'document';
  url: string;
  thumbnailUrl?: string;
  name: string;
  uploadDate: string;
}

export interface Visit {
  id: string;
  date: string;
  provider: string;
  reason: string;
  procedures: VisitProcedure[];
  totalCost: number;
  insurancePaid: number;
  patientPaid: number;
  paymentMethod?: string;
  outcome?: string;
  notes?: string;
}

export interface VisitProcedure {
  code: string;
  name: string;
  cost: number;
}

export interface BillingInfo {
  lifetimeSpend: number;
  outstandingBalance: number;
  coverageUsed: number;
  nextPaymentDue?: {
    date: string;
    amount: number;
  };
}

export type PatientStatus = 'allergies' | 'outstanding-balance' | 'follow-up-due' | 'pre-medication';

export interface PatientStats {
  lastVisit: string;
  totalVisits: number;
  lifetimeSpend: number;
}

export type ViewMode = 'grid' | 'list';

export type CoverageTier = 'high' | 'medium' | 'low' | 'none';

export interface FilterOptions {
  insuranceProviders: string[];
  coverageTiers: CoverageTier[];
  healthFlags: {
    hasAllergies: boolean;
    preMedicationRequired: boolean;
    outstandingBalance: boolean;
    followUpDue: boolean;
  };
  lastVisitRange?: {
    from: string;
    to: string;
  };
  spendRange?: {
    min: number;
    max: number;
  };
}

export type SortOption = 'last-visit' | 'name-asc' | 'spend-desc' | 'balance-desc';
