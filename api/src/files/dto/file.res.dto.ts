import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PROGRESS_STATUS } from '@prisma/client';

export class PaginationResDto {
  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class FileResDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Chapter 01 Page 1' })
  title!: string;

  @ApiPropertyOptional({ example: 'First page of chapter 01.', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 4 })
  folderId!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class MaterialResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 5 })
  fileId!: number;

  @ApiProperty({ example: { layers: ['background', 'characters'], colors: ['#FF0000', '#00FF00'] } })
  materials!: unknown;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class TaskResDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Review page 1' })
  title!: string;

  @ApiPropertyOptional({ example: 'Check for errors', nullable: true })
  description?: string | null;

  @ApiProperty({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.PENDING })
  status!: PROGRESS_STATUS;

  @ApiPropertyOptional({ example: 9, nullable: true })
  parentId?: number | null;

  @ApiProperty({ example: 5 })
  fileId!: number;

  @ApiPropertyOptional({ example: 2, nullable: true })
  assignedBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class FileResponseDto {
  @ApiProperty({ type: FileResDto })
  data!: FileResDto;
}

export class MaterialResponseDto {
  @ApiProperty({ type: MaterialResDto })
  data!: MaterialResDto;
}

export class TaskResponseDto {
  @ApiProperty({ type: TaskResDto })
  data!: TaskResDto;
}

export class TasksResponseDto {
  @ApiProperty({ type: [TaskResDto] })
  data!: TaskResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
