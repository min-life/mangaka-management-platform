import { SCOPE } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(SCOPE)
  @IsOptional()
  scope?: SCOPE;
}
