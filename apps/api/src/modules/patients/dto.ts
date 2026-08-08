import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListPatientsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string | null;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string | null;

  @IsOptional()
  @IsIn(['new', 'existing'])
  patientType?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  emergencyContactRelationship?: string | null;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  emergencyContactPhone?: string | null;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string | null;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string | null;

  @IsOptional()
  @IsIn(['new', 'existing'])
  patientType?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  emergencyContactRelationship?: string | null;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  emergencyContactPhone?: string | null;
}
