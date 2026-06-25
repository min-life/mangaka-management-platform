import { ApiProperty } from '@nestjs/swagger';

export class ProjectStatResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 5 })
  projectId!: number;

  @ApiProperty({ example: { totalTasks: 100, completedTasks: 50, progress: 50 } })
  metrics!: unknown;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class ProjectStatResponseDto {
  @ApiProperty({ type: ProjectStatResDto })
  data!: ProjectStatResDto;
}

export class CreateProjectStatReqDto {
  @ApiProperty({ example: { totalTasks: 100, completedTasks: 50, progress: 50 } })
  metrics!: unknown;
}
