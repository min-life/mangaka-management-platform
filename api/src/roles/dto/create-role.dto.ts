import { SCOPE } from '@prisma/client';
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsEnum(SCOPE)
  @IsOptional()
  scope?: SCOPE;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
