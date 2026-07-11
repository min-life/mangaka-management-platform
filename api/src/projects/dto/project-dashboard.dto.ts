import { ApiProperty } from '@nestjs/swagger';
import { PROGRESS_STATUS, APPLICATION_STATUS } from '@prisma/client';

export class DashboardOverviewDto {
  @ApiProperty({ example: 12 })
  totalMembers!: number;

  @ApiProperty({ example: 5 })
  totalFolders!: number;

  @ApiProperty({ example: 120 })
  totalFiles!: number;

  @ApiProperty({ example: 45 })
  totalTasks!: number;
}

export class DashboardProgressStatsDto {
  @ApiProperty({ example: 20 })
  completedTasks!: number;

  @ApiProperty({ example: 10 })
  pendingTasks!: number;

  @ApiProperty({ example: 10 })
  inProgressTasks!: number;

  @ApiProperty({ example: 5 })
  reviewTasks!: number;
}

export class DashboardTaskDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Draw chapter 1 lineart' })
  title!: string;

  @ApiProperty({ enum: PROGRESS_STATUS, example: PROGRESS_STATUS.INPROGRESS })
  status!: PROGRESS_STATUS;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z', nullable: true })
  deadline!: Date | null;

  @ApiProperty({ example: 100 })
  fileId!: number;
}

export class DashboardApplicationDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'Request to publish chapter 1' })
  title!: string;

  @ApiProperty({ enum: APPLICATION_STATUS, example: APPLICATION_STATUS.SUBMITTED })
  status!: APPLICATION_STATUS;
}

export class DashboardMyWorkspaceDto {
  @ApiProperty({ type: [DashboardTaskDto] })
  activeTasks!: DashboardTaskDto[];
}

export class DashboardActionNeededDto {
  @ApiProperty({ type: [DashboardTaskDto] })
  overdueTasks!: DashboardTaskDto[];

  @ApiProperty({ type: [DashboardTaskDto] })
  dueSoonTasks!: DashboardTaskDto[];

  @ApiProperty({ type: [DashboardApplicationDto] })
  pendingApplications!: DashboardApplicationDto[];
}

export class DashboardFolderDto {
  @ApiProperty({ example: 15 })
  id!: number;

  @ApiProperty({ example: 'Chapter 1' })
  title!: string;
}

export class DashboardRecentFileDto {
  @ApiProperty({ example: 100 })
  id!: number;

  @ApiProperty({ example: 'Page 01' })
  title!: string;

  @ApiProperty({ example: 'https://example.com/image.png', nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ example: '2026-07-11T12:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: DashboardFolderDto })
  folder!: DashboardFolderDto;
}

export class ProjectDashboardDataDto {
  @ApiProperty({ type: DashboardOverviewDto })
  overview!: DashboardOverviewDto;

  @ApiProperty({ type: DashboardProgressStatsDto })
  progressStats!: DashboardProgressStatsDto;

  @ApiProperty({ type: DashboardMyWorkspaceDto })
  myWorkspace!: DashboardMyWorkspaceDto;

  @ApiProperty({ type: DashboardActionNeededDto })
  actionNeeded!: DashboardActionNeededDto;

  @ApiProperty({ type: [DashboardRecentFileDto] })
  recentFiles!: DashboardRecentFileDto[];
}

export class ProjectDashboardResponseDto {
  @ApiProperty({ type: ProjectDashboardDataDto })
  data!: ProjectDashboardDataDto;
}
