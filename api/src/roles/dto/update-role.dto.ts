import { SCOPE } from '@prisma/client';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SCOPE)
  @IsOptional()
  scope?: SCOPE;
}
