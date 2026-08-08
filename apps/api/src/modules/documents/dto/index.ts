import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../../config/storage';

const DOCUMENT_CATEGORIES = [
  'consent',
  'insurance_card',
  'lab_report',
  'referral',
  'other',
  'radiograph',
  'clinical_photo',
  'treatment_plan',
] as const;

export class RequestDocumentUploadDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsIn(DOCUMENT_CATEGORIES)
  category!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fileName!: string;

  @IsIn([...ALLOWED_MIME_TYPES])
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  sizeBytes!: number;

  @IsString()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/)
  checksumSha256!: string;
}

export class ConfirmDocumentUploadDto {
  @IsOptional()
  @IsString()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/)
  checksumSha256?: string;
}
