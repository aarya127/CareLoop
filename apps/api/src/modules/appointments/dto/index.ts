// Appointment DTOs — validated via the global ValidationPipe (whitelist + transform).
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string; // YYYY-MM-DD

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  duration!: number; // minutes
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
