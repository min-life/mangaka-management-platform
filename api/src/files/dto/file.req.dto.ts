import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PROGRESS_STATUS } from '@prisma/client';

export class UpdateFileReqDto {
  @ApiPropertyOptional({ example: 'Updated file title' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  description?: string;
}

export class CreateMaterialReqDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'The files to upload' })
  files!: any[];
}

export class CreateTaskReqDto {
  @ApiProperty({ example: 'Review page 1' })
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Check for errors' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.PENDING })
  @IsOptional()
  @IsEnum(PROGRESS_STATUS)
  status?: PROGRESS_STATUS;

  @ApiPropertyOptional({ example: '2026-06-18T03:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  deadline?: Date;

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
