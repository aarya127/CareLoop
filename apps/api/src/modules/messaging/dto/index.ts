import { IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export type MessageChannel = 'sms' | 'email';

export class SendMessageDto {
  @IsString()
  patientId!: string;

  @IsIn(['sms', 'email'])
  channel!: MessageChannel;

  @IsString()
  @MaxLength(320)
  to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @IsString()
  @MaxLength(20_000)
  body!: string;

  @IsOptional()
  @IsString()
  reminderId?: string;
}

export class ScheduleReminderDto extends SendMessageDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export interface ConversationEntry {
  id: string;
  channel: string;
  type: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  metadata?: unknown;
}
