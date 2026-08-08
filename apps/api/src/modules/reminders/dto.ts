import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReminderHistoryQueryDto {
  @IsOptional() @IsString() @MaxLength(100) patientId?: string;
  @IsOptional() @IsIn(['sms', 'email']) channel?: string;
  @IsOptional() @IsIn(['pending', 'sent', 'failed', 'cancelled']) status?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 100;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class CreateReminderDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsIn(['sms', 'email'])
  channel!: 'sms' | 'email';

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  @MaxLength(320)
  to!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
