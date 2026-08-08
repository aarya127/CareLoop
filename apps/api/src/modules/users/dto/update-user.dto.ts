import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'firstName cannot be blank' })
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'lastName cannot be blank' })
  @MaxLength(100)
  lastName?: string;
}
