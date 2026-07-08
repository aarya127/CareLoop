import { IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const TREATMENT_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const;

export class CreateTreatmentDto {
  // practiceId is derived from the session, not the body — accepted but ignored.
  @IsOptional()
  @IsString()
  practiceId?: string;

  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  procedureCode?: string;

  @IsOptional()
  @IsInt()
  toothNumber?: number;

  @IsOptional()
  @IsString()
  surface?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(TREATMENT_STATUSES)
  status?: string; // planned | in_progress | completed | cancelled
}

export class UpdateTreatmentDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  procedureCode?: string;

  @IsOptional()
  @IsInt()
  toothNumber?: number;

  @IsOptional()
  @IsString()
  surface?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(TREATMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsISO8601()
  completedAt?: string;
}
