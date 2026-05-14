import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  practiceId!: string;

  @IsOptional()
  @IsIn(['STAFF', 'MANAGER', 'ADMIN', 'SERVICE_ACCOUNT'])
  role?: 'STAFF' | 'MANAGER' | 'ADMIN' | 'SERVICE_ACCOUNT';
}
