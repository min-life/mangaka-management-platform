import { ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUS, APPLICATION_TYPE } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryApplicationsReqDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId?: number;

  @ApiPropertyOptional({ example: 'publish' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: APPLICATION_TYPE, example: APPLICATION_TYPE.CREATE_CHAPTER })
  @IsOptional()
  @IsEnum(APPLICATION_TYPE)
  type?: APPLICATION_TYPE;

  @ApiPropertyOptional({ enum: APPLICATION_STATUS, example: APPLICATION_STATUS.PENDING })
  @IsOptional()
  @IsEnum(APPLICATION_STATUS)
  status?: APPLICATION_STATUS;

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
