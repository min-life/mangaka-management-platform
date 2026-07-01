import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsReqDto, ActivityLogsResponseDto } from './dto';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @ApiOperation({ summary: 'Get my activity logs with pagination' })
  @ApiOkResponse({ description: 'Return paginated activity logs', type: ActivityLogsResponseDto })
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
