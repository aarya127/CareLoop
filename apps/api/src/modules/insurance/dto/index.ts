// Insurance DTOs

import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

/**
 * Structured dental coverage. Stored in PatientInsurance.coverageSummary (JSON)
 * so it stays flexible per payer, but with a defined shape so the UI and benefit
 * math are consistent. Percentages are 0–100; money is in cents.
 */
export class CoverageSummaryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  annualMaximumCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deductibleCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
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
