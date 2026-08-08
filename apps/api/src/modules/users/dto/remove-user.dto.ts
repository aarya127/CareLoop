import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RemoveUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
