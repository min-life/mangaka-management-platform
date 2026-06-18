import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUS, APPLICATION_TYPE, SCOPE } from '@prisma/client';

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

export class ProjectResDto {
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

export class RoleResDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'project_member' })
  code!: string;

  @ApiProperty({ example: 'Project Member' })
  name!: string;

  @ApiProperty({ enum: SCOPE, example: SCOPE.PRJ })
  scope!: SCOPE;

  @ApiProperty({ example: true })
  isDefault!: boolean;
}

export class ProjectMemberResDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'member@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Project Member', nullable: true })
  displayName?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ type: RoleResDto })
  role!: RoleResDto;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class ProjectEditorBoardResDto {
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

export class ProjectApplicationResDto {
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

export class ProjectFolderResDto {
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

export class SuccessResDto {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class ProjectResponseDto {
  @ApiProperty({ type: ProjectResDto })
  data!: ProjectResDto;
}

export class ProjectsResponseDto {
  @ApiProperty({ type: [ProjectResDto] })
  data!: ProjectResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class ProjectMemberResponseDto {
  @ApiProperty({ type: ProjectMemberResDto })
  data!: ProjectMemberResDto;
}

export class ProjectMembersResponseDto {
  @ApiProperty({ type: [ProjectMemberResDto] })
  data!: ProjectMemberResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class ProjectEditorBoardResponseDto {
  @ApiProperty({ type: ProjectEditorBoardResDto, nullable: true })
  data!: ProjectEditorBoardResDto | null;
}

export class ProjectApplicationsResponseDto {
  @ApiProperty({ type: [ProjectApplicationResDto] })
  data!: ProjectApplicationResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class ProjectApplicationResponseDto {
  @ApiProperty({ type: ProjectApplicationResDto })
  data!: ProjectApplicationResDto;
}

export class ProjectFoldersResponseDto {
  @ApiProperty({ type: [ProjectFolderResDto] })
  data!: ProjectFolderResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}

export class ProjectFolderResponseDto {
  @ApiProperty({ type: ProjectFolderResDto })
  data!: ProjectFolderResDto;
}

export class SuccessResponseDto {
  @ApiProperty({ type: SuccessResDto })
  data!: SuccessResDto;
}
