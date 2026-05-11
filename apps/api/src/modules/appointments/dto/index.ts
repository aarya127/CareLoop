// Appointment DTOs

export interface CreateAppointmentDto {
  practiceId: string;
  userId: string;       // staff member booking the appointment
  providerId: string;
  patientId?: string;
  roomId?: string;
  title?: string;
  start: string;        // ISO datetime
  end: string;          // ISO datetime
  timeZone?: string;
  notes?: string;
  procedureCode?: string;
  source?: string;      // 'manual' | 'ai' | 'online'
}

export interface RescheduleDto {
  start: string;
  end: string;
  reason?: string;
}

export interface CancelDto {
  reason?: string;
}

export interface GetSlotsDto {
  practiceId: string;
  providerId: string;
  date: string;         // YYYY-MM-DD
  duration: string | number;  // minutes
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
