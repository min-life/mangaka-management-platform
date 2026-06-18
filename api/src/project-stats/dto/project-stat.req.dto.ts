import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectStatReqDto {
  @ApiProperty({ example: { totalTasks: 100, completedTasks: 50, progress: 50 } })
  metrics!: unknown;
}

export class CreateProjectStatReqDto {
  @ApiProperty({ example: { totalTasks: 100, completedTasks: 50, progress: 50 } })
  metrics!: unknown;
}
