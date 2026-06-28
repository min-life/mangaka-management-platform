import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CommentsResponseDto {
  @ApiProperty({ type: [CommentResDto] })
  data!: CommentResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
