import { SCOPE } from '@prisma/client';
import { IsEnum, IsString, IsOptional, IsArray, ArrayUnique } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SCOPE)
  @IsOptional()
  scope?: SCOPE;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
