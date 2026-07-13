import { SCOPE } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class PermissionFilterDto {
  @IsOptional()
  @IsEnum(SCOPE)
  scope?: SCOPE;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['id', 'name', 'scope'])
  sortBy?: 'id' | 'name' | 'scope';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
