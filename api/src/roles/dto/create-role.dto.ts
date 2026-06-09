import { SCOPE } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsEnum(SCOPE)
  @IsOptional()
  scope?: SCOPE;
}
