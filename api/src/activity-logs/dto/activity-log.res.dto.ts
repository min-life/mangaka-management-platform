import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ACTIVITY_ACTION, ENTITY_TYPE } from '@prisma/client';
import { UserResDto } from '../../share/dto/user.res.dto';

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

export class ActivityLogResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: ACTIVITY_ACTION, example: ACTIVITY_ACTION.TASK_CREATED })
  action!: ACTIVITY_ACTION;

  @ApiProperty({ enum: ENTITY_TYPE, example: ENTITY_TYPE.PROJECT })
  entityType!: ENTITY_TYPE;

  @ApiProperty({ example: 10 })
  entityId!: number;

  @ApiPropertyOptional({ example: 5 })
  projectId?: number | null;

  @ApiPropertyOptional({ example: 2 })
  editorBoardId?: number | null;

  @ApiPropertyOptional({ example: 12 })
  fileId?: number | null;

  @ApiProperty({ example: 1 })
  actorId!: number;

  @ApiPropertyOptional({ example: { name: 'New Project' } })
  metadata?: any;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: UserResDto })
  actor?: UserResDto;
}

export class ActivityLogsResponseDto {
  @ApiProperty({ type: [ActivityLogResDto] })
  data!: ActivityLogResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
