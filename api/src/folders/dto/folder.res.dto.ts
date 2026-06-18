import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class FolderResDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'Draft pages' })
  title!: string;

  @ApiPropertyOptional({ example: 'Initial rough sketches.', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  parentId?: number | null;

  @ApiProperty({ example: 10 })
  projectId!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
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

export class FolderResponseDto {
  @ApiProperty({ type: FolderResDto })
  data!: FolderResDto;
}

export class FileResponseDto {
  @ApiProperty({ type: FileResDto })
  data!: FileResDto;
}

export class FilesResponseDto {
  @ApiProperty({ type: [FileResDto] })
  data!: FileResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class ChildrenResponseDto {
  @ApiProperty({ type: [FolderResDto] })
  data!: FolderResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
