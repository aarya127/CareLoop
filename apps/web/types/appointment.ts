export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  procedureCodes?: string[];
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
