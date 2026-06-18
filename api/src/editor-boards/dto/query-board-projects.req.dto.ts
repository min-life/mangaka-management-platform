import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryBoardProjectsReqDto {
  @ApiPropertyOptional({ example: 'chapter' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['name', 'createdAt'], example: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt'])
  field?: 'name' | 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

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
