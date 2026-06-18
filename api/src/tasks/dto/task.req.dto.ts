import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PROGRESS_STATUS } from '@prisma/client';

export class UpdateTaskReqDto {
  @ApiPropertyOptional({ example: 'Updated task title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.INPROGRESS })
  @IsOptional()
  @IsEnum(PROGRESS_STATUS)
  status?: PROGRESS_STATUS;

  @ApiPropertyOptional({ example: 9, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({ example: 2, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedBy?: number;
}
