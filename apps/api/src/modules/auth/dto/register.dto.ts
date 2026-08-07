import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsIn(['staff', 'manager', 'admin'])
  role?: 'staff' | 'manager' | 'admin';
}
