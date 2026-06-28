import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResDto } from '../../share/dto';
import { FolderResDto, SimpleFolderResDto } from '../../folders/dto';

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

export class SimpleFileResDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Chapter 01 Page 1' })
  title!: string;
}

export class FileResDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Chapter 01 Page 1' })
  title!: string;

  @ApiPropertyOptional({ example: 'First page of chapter 01.', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: () => SimpleFolderResDto, nullable: true })
  folder?: SimpleFolderResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class MaterialResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ type: () => SimpleFileResDto, nullable: true })
  file?: SimpleFileResDto | null;

  @ApiProperty({
    example: { layers: ['background', 'characters'], colors: ['#FF0000', '#00FF00'] },
  })
  materials!: unknown;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

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

export class FilesResponseDto {
  @ApiProperty({ type: [FileResDto] })
  data!: FileResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class MaterialsResponseDto {
  @ApiProperty({ type: [MaterialResDto] })
  data!: MaterialResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
