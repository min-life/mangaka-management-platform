import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsReqDto } from './dto';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @ApiOperation({ summary: 'Get my activity logs with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated activity logs' })
  @Get()
  async getMyActivityLogs(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: QueryActivityLogsReqDto,
  ) {
    return await this.activityLogsService.getActivityLogs({
      ...query,
      actorId: currentUser.userId,
    });
  }
}
