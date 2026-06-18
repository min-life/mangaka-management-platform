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

export class FrameResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 10.5, type: Number })
  startX!: number;

  @ApiProperty({ example: 20.3, type: Number })
  startY!: number;

  @ApiProperty({ example: 100.7, type: Number })
  endX!: number;

  @ApiProperty({ example: 150.2, type: Number })
  endY!: number;

  @ApiProperty({ example: 10 })
  taskId!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class CommentResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: { text: 'Review this area' } })
  content!: unknown;

  @ApiProperty({ example: 1 })
  frameId!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class FrameResponseDto {
  @ApiProperty({ type: FrameResDto })
  data!: FrameResDto;
}

export class CommentResponseDto {
  @ApiProperty({ type: CommentResDto })
  data!: CommentResDto;
}

export class CommentsResponseDto {
  @ApiProperty({ type: [CommentResDto] })
  data!: CommentResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
