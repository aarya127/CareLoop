import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePatientInvitationDto {
  @IsString()
  @MinLength(1)
  patientId!: string;

  // Patient has no email field of its own (pure clinical/demographic record) —
  // staff supplies the address to invite at invite time; it becomes the login
  // email once the invite is accepted.
  @IsEmail()
  email!: string;
}

export class AcceptPatientInvitationDto {
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;
}

export class PatientLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
