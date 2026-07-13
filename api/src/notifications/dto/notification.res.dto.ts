import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityLogResDto, PaginationResDto } from '../../activity-logs/dto';

export class NotificationResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 10 })
  userId!: number;

  @ApiProperty({ example: 5 })
  activityLogId!: number;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: ActivityLogResDto })
  activityLog?: ActivityLogResDto;
}

export class NotificationResponseDto {
  @ApiProperty({ type: NotificationResDto })
  data!: NotificationResDto;
}

export class NotificationsResponseDto {
  @ApiProperty({ type: [NotificationResDto] })
  data!: NotificationResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
