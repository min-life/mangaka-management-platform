import { SCOPE } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @IsEnum(SCOPE)
  @IsOptional()
  scope?: SCOPE;

  @IsString()
  @IsOptional()
  description?: string | null;
}
