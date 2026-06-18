import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { FieldBoardsType, OrderBoardsType } from '../interfaces';

export class QueryBoardsReqDto {
  @ApiPropertyOptional({ example: 'review' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  me?: boolean;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'name'], example: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'name'])
  field?: FieldBoardsType;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: OrderBoardsType;

  @ApiPropertyOptional({ example: 1, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
