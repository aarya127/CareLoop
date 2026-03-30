export interface InsurancePlan {
  id: string;
  patientId: string;
  payerName: string;
  payerId: string;
  memberId: string;
  groupNumber?: string;
  relationship: 'SELF' | 'SPOUSE' | 'CHILD' | 'OTHER';
  planType: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  effectiveDate: string;
  terminationDate?: string;
  annualMaximum?: number;
  deductible?: number;
  deductibleMet?: number;
}

export interface EligibilityResult {
  isActive: boolean;
  coveredServices: string[];
  copay?: number;
  coinsurance?: number;
  remainingBenefit?: number;
}
