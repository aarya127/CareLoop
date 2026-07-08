import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'] as const;

export class LineItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  procedureCode?: string;

  @IsInt()
  @IsPositive()
  qty!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;
}

export class CreateInvoiceDto {
  // practiceId is derived from the session, not the body — accepted but ignored.
  @IsOptional()
  @IsString()
  practiceId?: string;

  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsOptional()
  @IsString()
  treatmentId?: string;

  @IsOptional()
  @IsString()
  payerType?: string; // 'patient' | 'insurance'

  @IsInt()
  @Min(0)
  totalAmountCents!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems?: LineItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: string; // draft | sent | paid | overdue | void

  @IsOptional()
  @IsString()
  payerType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalAmountCents?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems?: LineItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}

export interface BillingSummaryQuery {
  practiceId: string;
  patientId?: string;
  from?: string;
  to?: string;
}

export interface InvoiceFilter {
  practiceId?: string;
  patientId?: string;
  status?: string;
  from?: string;
  to?: string;
}
