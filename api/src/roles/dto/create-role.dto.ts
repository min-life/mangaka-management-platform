import { SCOPE } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
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
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];
}
