import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ClaimLineDto {
  @IsString()
  procedureCode!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  toothNumber?: number;

  @IsInt()
  @Min(0)
  chargedCents!: number;
}

export class CreateClaimDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  insuranceId?: string;

  @IsOptional()
  @IsString()
  treatmentId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimLineDto)
  lines!: ClaimLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

// Adjudication outcomes a payer/clearinghouse reports back.
export const CLAIM_RESOLUTION_STATUSES = ['accepted', 'rejected', 'paid', 'void'] as const;

export class UpdateClaimStatusDto {
  @IsIn(CLAIM_RESOLUTION_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  code?: string; // rejection / adjudication code

  @IsOptional()
  @IsInt()
  @Min(0)
  approvedAmountCents?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
