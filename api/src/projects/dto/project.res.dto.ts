import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUS, APPLICATION_TYPE, SCOPE } from '@prisma/client';
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

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class ProjectResDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'One-shot Chapter 01' })
  name!: string;

  @ApiPropertyOptional({ example: 'A one-shot manga chapter', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/project.png', nullable: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({ type: EditorBoardResDto, nullable: true })
  editorBoard?: EditorBoardResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

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

export class TaskOverviewResDto {
  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 2 })
  pending!: number;

  @ApiProperty({ example: 5 })
  inprogress!: number;

  @ApiProperty({ example: 2 })
  review!: number;

  @ApiProperty({ example: 1 })
  done!: number;
}

export class ProjectMemberResDto {
  @ApiProperty({ type: UserResDto })
  user!: UserResDto;

  @ApiProperty({ type: RoleResDto })
  role!: RoleResDto;

  @ApiProperty({ example: 5 })
  numberOfTasks!: number;

  @ApiPropertyOptional({ type: TaskOverviewResDto, nullable: true })
  taskOverview?: TaskOverviewResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class ProjectEditorBoardResDto {
  @ApiProperty({ type: EditorBoardResDto, nullable: true })
  data!: EditorBoardResDto | null;
}

export class ProjectApplicationResDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ type: ProjectResDto })
  project!: ProjectResDto;

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

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  verifiedByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

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

  @ApiPropertyOptional({ type: ProjectFolderResDto, nullable: true })
  parent?: ProjectFolderResDto | null;

  @ApiProperty({ type: ProjectResDto })
  project!: ProjectResDto;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

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
