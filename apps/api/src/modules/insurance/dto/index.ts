// Insurance DTOs

import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInsuranceDto {
  @IsString()
  patientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  payerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  planName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  memberIdEnc!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  groupNumberEnc?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoverageSummaryDto)
  coverageSummary?: CoverageSummaryDto;
}

export class UpdateInsuranceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  payerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  planName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  memberIdEnc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  groupNumberEnc?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoverageSummaryDto)
  coverageSummary?: CoverageSummaryDto;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class LookupInsuranceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  memberId!: string;
}

/**
 * Structured dental coverage. Stored in PatientInsurance.coverageSummary (JSON)
 * so it stays flexible per payer, but with a defined shape so the UI and benefit
 * math are consistent. Percentages are 0–100; money is in cents.
 */
export class CoverageSummaryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  annualMaximumCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  deductibleCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  usedToDateCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  preventivePct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  basicPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  majorPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  orthoPct?: number;

  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;

  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;
}

/** Computed benefit remaining for the plan year. */
export function remainingBenefitCents(c: CoverageSummaryDto | null | undefined): number | null {
  if (!c || typeof c.annualMaximumCents !== 'number') return null;
  const used = typeof c.usedToDateCents === 'number' ? c.usedToDateCents : 0;
  return Math.max(0, c.annualMaximumCents - used);
}
