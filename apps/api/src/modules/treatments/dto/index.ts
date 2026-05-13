export interface CreateTreatmentDto {
  practiceId: string;
  patientId: string;
  appointmentId?: string;
  providerId?: string;
  procedureCode?: string;
  toothNumber?: number;
  surface?: string;
  notes?: string;
  status?: string; // planned | in_progress | completed | cancelled
}

export interface UpdateTreatmentDto {
  appointmentId?: string;
  providerId?: string;
  procedureCode?: string;
  toothNumber?: number;
  surface?: string;
  notes?: string;
  status?: string;
  completedAt?: string;
}
