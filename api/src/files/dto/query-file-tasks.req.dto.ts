import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PROGRESS_STATUS } from '@prisma/client';

export class QueryFileTasksReqDto {
  @ApiPropertyOptional({ example: 'review' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.PENDING })
  @IsOptional()
  @IsEnum(PROGRESS_STATUS)
  status?: PROGRESS_STATUS;

  @ApiPropertyOptional({ enum: ['title', 'createdAt'], example: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(['title', 'createdAt'])
  field?: 'title' | 'createdAt';

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
