import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class AddressData {
  @IsOptional() @IsString() @MaxLength(200) street?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsOptional() @IsString() @MaxLength(20) zip?: string;
}

export class DemographicsData {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfBirth?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== '')
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional() @IsString() @MaxLength(40) phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressData)
  address?: AddressData;
}

export class EmergencyContactData {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(80) relationship?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

export class InsuranceData {
  @IsOptional() @IsString() @MaxLength(150) payerName?: string;
  @IsOptional() @IsString() @MaxLength(150) planName?: string;
  @IsOptional() @IsString() @MaxLength(200) memberId?: string;
  @IsOptional() @IsString() @MaxLength(200) groupNumber?: string;
}

export interface IntakeDraftData {
  demographics?: DemographicsData;
  emergencyContact?: EmergencyContactData;
  insurance?: InsuranceData;
  notes?: string;
}

export class CreateDraftFromLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  linkToken!: string;
}

export class CreateDraftDto {
  practiceId!: string;
}

export class UpdateDraftDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DemographicsData)
  demographics?: DemographicsData;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactData)
  emergencyContact?: EmergencyContactData;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceData)
  insurance?: InsuranceData;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
