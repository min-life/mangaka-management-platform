import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResDto } from '../../share/dto';
import { ProjectBasicResDto } from '../../projects/dto';

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

export class SimpleFolderResDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'Draft pages' })
  title!: string;

  @ApiPropertyOptional({ example: 'Initial rough sketches.', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/image.png', nullable: true })
  imageUrl?: string | null;
}

export class FolderResDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'Draft pages' })
  title!: string;

  @ApiPropertyOptional({ example: 'Initial rough sketches.', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/image.png', nullable: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({ type: SimpleFolderResDto, nullable: true })
  parent?: SimpleFolderResDto | null;

  @ApiPropertyOptional({ type: () => ProjectBasicResDto, nullable: true })
  project?: ProjectBasicResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class FolderResponseDto {
  @ApiProperty({ type: FolderResDto })
  data!: FolderResDto;
}

export class FoldersResponseDto {
  @ApiProperty({ type: [FolderResDto] })
  data!: FolderResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class ChildrenResponseDto {
  @ApiProperty({ type: [FolderResDto] })
  data!: FolderResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
