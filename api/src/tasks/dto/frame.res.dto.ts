import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResDto } from './task.res.dto';
import { UserResDto } from '../../share/dto';
import { TaskResDto } from './task.res.dto';

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

  @ApiProperty({ type: TaskResDto })
  task!: TaskResDto;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
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

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
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

export class FramesResponseDto {
  @ApiProperty({ type: [FrameResDto] })
  data!: FrameResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class CommentsResponseDto {
  @ApiProperty({ type: [CommentResDto] })
  data!: CommentResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
