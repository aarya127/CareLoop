import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const INVITABLE_ROLES = ['staff', 'manager', 'admin', 'provider', 'hygienist'] as const;

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsIn(INVITABLE_ROLES)
  role!: string;
}

export class AcceptInvitationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;
}
