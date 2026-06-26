import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PROGRESS_STATUS } from '@prisma/client';
import { UserResDto } from '../../share/dto';
import { FileResDto } from '../../files/dto';

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

export class TaskResDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Review page 1' })
  title!: string;

  @ApiPropertyOptional({ example: 'Check for errors', nullable: true })
  description?: string | null;

  @ApiProperty({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.PENDING })
  status!: PROGRESS_STATUS;

  @ApiPropertyOptional({ type: TaskResDto, nullable: true })
  parent?: TaskResDto | null;

  @ApiProperty({ type: FileResDto })
  file!: FileResDto;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  assignedByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class SimpleFileResDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Chapter 01 Page 1' })
  title!: string;
}

export class TaskSummaryResDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Review page 1' })
  title!: string;

  @ApiPropertyOptional({ example: 'Check for errors', nullable: true })
  description?: string | null;

  @ApiProperty({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.PENDING })
  status!: PROGRESS_STATUS;

  @ApiPropertyOptional({ example: 5, nullable: true })
  parentId?: number | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  fileId?: number | null;

  @ApiPropertyOptional({ type: SimpleFileResDto, nullable: true })
  file?: SimpleFileResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  assignedByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class TaskResponseDto {
  @ApiProperty({ type: TaskResDto })
  data!: TaskResDto;
}

export class TasksResponseDto {
  @ApiProperty({ type: [TaskSummaryResDto] })
  data!: TaskSummaryResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
