import { IsIn, IsInt, IsOptional, IsPositive, IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

const PAYMENT_METHODS = ['card', 'cash', 'insurance', 'check', 'ach'] as const;
const PAYMENT_STATUSES = ['pending', 'completed', 'refunded', 'failed'] as const;

export class CreatePaymentDto {
  // practiceId is derived from the session, not the body — accepted but ignored.
  @IsOptional()
  @IsString()
  practiceId?: string;

  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsOptional()
  @IsString()
  payerType?: string; // 'patient' | 'insurance'

  @IsIn(PAYMENT_METHODS)
  method!: string; // card | cash | insurance | check | ach

  @IsInt()
  @IsPositive() // reject zero/negative amounts
  amountCents!: number;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: string; // pending | completed | refunded | failed

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}

export interface PaymentFilter {
  practiceId?: string;
  patientId?: string;
  invoiceId?: string;
  status?: string;
  from?: string;
  to?: string;
}
