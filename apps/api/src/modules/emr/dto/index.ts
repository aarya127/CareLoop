import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

// ---------------------------------------------------------------------------
// Encounters (SOAP visit notes)
// ---------------------------------------------------------------------------
export const ENCOUNTER_TYPES = ['exam', 'cleaning', 'consult', 'procedure', 'followup'];

export class CreateEncounterDto {
  @IsOptional() @IsString() @IsIn(ENCOUNTER_TYPES) type?: string;
  @IsOptional() @IsISO8601() encounterDate?: string;
  @IsOptional() @IsString() appointmentId?: string;
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsString() chiefComplaint?: string;
  @IsOptional() @IsString() subjective?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() assessment?: string;
  @IsOptional() @IsString() plan?: string;
}

export class UpdateEncounterDto {
  @IsOptional() @IsString() @IsIn(ENCOUNTER_TYPES) type?: string;
  @IsOptional() @IsISO8601() encounterDate?: string;
  @IsOptional() @IsString() appointmentId?: string;
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsString() chiefComplaint?: string;
  @IsOptional() @IsString() subjective?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() assessment?: string;
  @IsOptional() @IsString() plan?: string;
}

// ---------------------------------------------------------------------------
// Allergies
// ---------------------------------------------------------------------------
export const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe', 'life_threatening'];

export class CreateAllergyDto {
  @IsString() @MinLength(1) allergen!: string;
  @IsOptional() @IsString() @IsIn(ALLERGY_SEVERITIES) severity?: string;
  @IsOptional() @IsString() reaction?: string;
  @IsOptional() @IsString() @IsIn(['active', 'inactive']) status?: string;
}

export class UpdateAllergyDto {
  @IsOptional() @IsString() @MinLength(1) allergen?: string;
  @IsOptional() @IsString() @IsIn(ALLERGY_SEVERITIES) severity?: string;
  @IsOptional() @IsString() reaction?: string;
  @IsOptional() @IsString() @IsIn(['active', 'inactive']) status?: string;
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------
export class CreateMedicationDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() @IsIn(['active', 'discontinued']) status?: string;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
  @IsOptional() @IsString() prescribedBy?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateMedicationDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() @IsIn(['active', 'discontinued']) status?: string;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
  @IsOptional() @IsString() prescribedBy?: string;
  @IsOptional() @IsString() notes?: string;
}

// ---------------------------------------------------------------------------
// Conditions (problem list)
// ---------------------------------------------------------------------------
export class CreateConditionDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() @IsIn(['active', 'resolved', 'chronic']) status?: string;
  @IsOptional() @IsISO8601() onsetDate?: string;
  @IsOptional() @IsISO8601() resolvedDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateConditionDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() @IsIn(['active', 'resolved', 'chronic']) status?: string;
  @IsOptional() @IsISO8601() onsetDate?: string;
  @IsOptional() @IsISO8601() resolvedDate?: string;
  @IsOptional() @IsString() notes?: string;
}

// ---------------------------------------------------------------------------
// Tooth chart
// ---------------------------------------------------------------------------
export class UpsertToothChartEntryDto {
  @IsString() @MinLength(1) condition!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) surfaces?: string[];
  @IsOptional() @IsString() @IsIn(['active', 'planned', 'resolved']) status?: string;
  @IsOptional() @IsString() notes?: string;
}

// ---------------------------------------------------------------------------
// Periodontal exams
// ---------------------------------------------------------------------------
export class CreatePeriodontalExamDto {
  @IsOptional() @IsISO8601() examDate?: string;
  // Per-tooth-site measurements, stored as JSON.
  @IsOptional() @IsObject() measurements?: Record<string, unknown>;
  @IsOptional() @IsString() summary?: string;
}

// ---------------------------------------------------------------------------
// Shared: the authenticated user shape populated by SessionAuthGuard
// ---------------------------------------------------------------------------
export interface EmrActor {
  id: string;
  practiceId: string;
  role?: string;
}

// re-export so controllers can validate tooth numbers via a pipe if needed
export const TOOTH_NUMBER_MIN = 1;
export const TOOTH_NUMBER_MAX = 32;

export class ToothNumberParamDto {
  @IsInt() @Min(TOOTH_NUMBER_MIN) @Max(TOOTH_NUMBER_MAX) toothNumber!: number;
}

// ---------------------------------------------------------------------------
// Treatment Plans
// ---------------------------------------------------------------------------
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

const PLAN_ITEM_STATUS = ['planned', 'approved', 'completed', 'declined'];
const PLAN_STATUS = ['draft', 'proposed', 'accepted', 'completed', 'cancelled'];

export class TreatmentPlanItemInputDto {
  @IsString() @MinLength(1) description!: string;
  @IsOptional() @IsInt() @Min(TOOTH_NUMBER_MIN) @Max(TOOTH_NUMBER_MAX) toothNumber?: number;
  @IsOptional() @IsString() surface?: string;
  @IsOptional() @IsString() procedureCode?: string;
  @IsOptional() @IsInt() @Min(0) feeCents?: number;
  @IsOptional() @IsString() @IsIn(PLAN_ITEM_STATUS) status?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateTreatmentPlanDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(0) insuranceEstimateCents?: number;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentPlanItemInputDto)
  items?: TreatmentPlanItemInputDto[];
}

export class UpdateTreatmentPlanDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() @IsIn(PLAN_STATUS) status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsInt() @Min(0) insuranceEstimateCents?: number;
}

export class UpdateTreatmentPlanItemDto {
  @IsOptional() @IsString() @MinLength(1) description?: string;
  @IsOptional() @IsInt() @Min(TOOTH_NUMBER_MIN) @Max(TOOTH_NUMBER_MAX) toothNumber?: number;
  @IsOptional() @IsString() surface?: string;
  @IsOptional() @IsString() procedureCode?: string;
  @IsOptional() @IsInt() @Min(0) feeCents?: number;
  @IsOptional() @IsString() @IsIn(PLAN_ITEM_STATUS) status?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

// ---------------------------------------------------------------------------
// AI Scribe: draft an encounter from a visit transcript
// ---------------------------------------------------------------------------
export class DraftFromTranscriptDto {
  @IsOptional() @IsString() callSid?: string;
  @IsOptional() @IsString() transcript?: string;
}
