import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsBoolean,
  IsNumber,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PROGRESS_STATUS } from '@prisma/client';

export class UpdateFileReqDto {
  @ApiPropertyOptional({ example: 'Updated file title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateMaterialReqDto {
  @ApiPropertyOptional({ example: 1, description: 'Task ID if uploaded from a task' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taskId?: number;

  @ApiPropertyOptional({ example: 'Bản thảo chính thức' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Thumbnail image file (PDF/Image)',
  })
  @IsOptional()
  image?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Document file (PDF/TXT/Docs)',
  })
  @IsOptional()
  text?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Source file (PSD/ZIP)' })
  @IsOptional()
  source?: any;
}

export class CreateTaskReqDto {
  @ApiProperty({ example: 'Review page 1' })
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Check for errors' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.PENDING })
  @IsOptional()
  @IsEnum(PROGRESS_STATUS)
  status?: PROGRESS_STATUS;

  @ApiPropertyOptional({ example: '2026-06-18T03:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deadline?: Date;

  @ApiPropertyOptional({ example: 9, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({ example: 9, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignedBy?: number;

  @ApiPropertyOptional({
    example: 1,
    type: Number,
    description: 'Clone material from a specific task ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cloneMaterialFromTaskId?: number;

  @ApiPropertyOptional({
    example: true,
    type: Boolean,
    description: 'Clone the base material of the file',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cloneBaseMaterial?: boolean;
}
