// Appointment DTOs — validated via the global ValidationPipe (whitelist + transform).
import { IsISO8601, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  // practiceId is derived from the session, not the body — accepted but ignored.
  @IsOptional()
  @IsString()
  practiceId?: string;

  @IsString()
  @IsNotEmpty()
  userId!: string; // staff member booking the appointment

  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsISO8601()
  start!: string; // ISO datetime

  @IsISO8601()
  end!: string; // ISO datetime

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  procedureCode?: string;

  @IsOptional()
  @IsString()
  source?: string; // 'manual' | 'ai' | 'online'
}

export class RescheduleDto {
  @IsISO8601()
  start!: string;

  @IsISO8601()
  end!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetSlotsDto {
  // practiceId is set from the session by the controller.
  @IsOptional()
  @IsString()
  practiceId?: string;

  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsString()
  @IsNotEmpty()
  date!: string; // YYYY-MM-DD

  @IsNotEmpty()
  duration!: string | number; // minutes
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
