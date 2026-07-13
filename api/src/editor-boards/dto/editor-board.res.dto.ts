import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserResDto } from '../../share/dto';
import { ProjectBasicResDto, ProjectResDto } from '../../projects/dto';
import { ApplicationResDto } from '../../applications/dto';

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

  @ApiPropertyOptional({ example: 'Board for weekly manga reviews', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/board.png', nullable: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: 5 })
  numberOfProjects!: number;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class BoardMemberResDto {
  @ApiProperty({ type: UserResDto })
  user!: UserResDto;

  @ApiProperty({ example: false })
  isLead!: boolean;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class BoardProjectResDto {
  @ApiProperty({ type: ProjectBasicResDto })
  project!: ProjectBasicResDto;
}

export class BoardApplicationResDto {
  @ApiProperty({ type: ApplicationResDto })
  application!: ApplicationResDto;
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
