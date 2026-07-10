import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Self-serve organization signup: creates a brand-new Practice and its first
 * admin User in one step. Distinct from RegisterDto (which adds a user to an
 * existing practice and requires an admin session).
 */
export class SignupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  practiceName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /** IANA timezone for the practice; defaults to America/New_York. */
  @IsOptional()
  @IsString()
  timeZone?: string;
}
