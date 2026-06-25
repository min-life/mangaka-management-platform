import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUS, APPLICATION_TYPE } from '@prisma/client';

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

export class EditorBoardResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Weekly Manga Review Board' })
  name!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class BoardMemberResDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'editor@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Min Editor', nullable: true })
  displayName?: string | null;

  @ApiProperty({ example: false })
  isLead!: boolean;
}

export class BoardProjectResDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'One-shot Chapter 01' })
  name!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  editorBoardId?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class BoardApplicationResDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ example: 10 })
  projectId!: number;

  @ApiProperty({ example: 'Publish request for chapter 01' })
  title!: string;

  @ApiPropertyOptional({ example: 'Please review before publishing.', nullable: true })
  description?: string | null;

  @ApiProperty({ example: [{ fileId: 1, page: 1 }] })
  materials!: unknown;

  @ApiProperty({ enum: APPLICATION_TYPE, example: APPLICATION_TYPE.PUBLISH_REQUEST })
  type!: APPLICATION_TYPE;

  @ApiProperty({ enum: APPLICATION_STATUS, example: APPLICATION_STATUS.PENDING })
  status!: APPLICATION_STATUS;

  @ApiPropertyOptional({ example: 3, nullable: true })
  verifyBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class AddProjectsResultResDto {
  @ApiProperty({ example: 2 })
  count!: number;
}

export class EditorBoardResponseDto {
  @ApiProperty({ type: EditorBoardResDto })
  data!: EditorBoardResDto;
}

export class EditorBoardsResponseDto {
  @ApiProperty({ type: [EditorBoardResDto] })
  data!: EditorBoardResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class BoardMemberResponseDto {
  @ApiProperty({ type: BoardMemberResDto })
  data!: BoardMemberResDto;
}

export class BoardMembersResponseDto {
  @ApiProperty({ type: [BoardMemberResDto] })
  data!: BoardMemberResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class BoardProjectsResponseDto {
  @ApiProperty({ type: [BoardProjectResDto] })
  data!: BoardProjectResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class AddBoardProjectsResponseDto {
  @ApiProperty({ type: AddProjectsResultResDto })
  data!: AddProjectsResultResDto;
}

export class BoardApplicationsResponseDto {
  @ApiProperty({ type: [BoardApplicationResDto] })
  data!: BoardApplicationResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
