import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserResDto } from '../../share/dto';

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

  @ApiPropertyOptional({ example: 'Frame 1', nullable: true })
  name?: string | null;

  @ApiProperty({ example: 10.5, type: Number })
  @Transform(({ value }) => value ? Number(value) : value)
  startX!: number;

  @ApiProperty({ example: 20.3, type: Number })
  @Transform(({ value }) => value ? Number(value) : value)
  startY!: number;

  @ApiProperty({ example: 100.7, type: Number })
  @Transform(({ value }) => value ? Number(value) : value)
  endX!: number;

  @ApiProperty({ example: 150.2, type: Number })
  @Transform(({ value }) => value ? Number(value) : value)
  endY!: number;

  @ApiProperty({ example: 10 })
  taskId!: number;

  @ApiPropertyOptional({ type: () => UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: () => UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

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

  @ApiPropertyOptional({ type: () => UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

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

export class SimpleMaterialContextDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: 'Material Name', nullable: true })
  name?: string | null;
}

export class SimpleFrameContextDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: 'Frame 1', nullable: true })
  name?: string | null;
}

export class CommentWithContextResDto extends CommentResDto {
  @ApiPropertyOptional({ example: 1, nullable: true })
  taskId?: number | null;

  @ApiPropertyOptional({ type: () => SimpleFrameContextDto, nullable: true })
  frame?: SimpleFrameContextDto | null;

  @ApiPropertyOptional({ type: () => SimpleMaterialContextDto, nullable: true })
  material?: SimpleMaterialContextDto | null;
}

export class FramesResponseDto {
  @ApiProperty({ type: [FrameResDto] })
  data!: FrameResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class CommentsResponseDto {
  @ApiProperty({ type: [CommentWithContextResDto] })
  data!: CommentWithContextResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
