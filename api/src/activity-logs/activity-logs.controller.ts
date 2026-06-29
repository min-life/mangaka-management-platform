import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsReqDto } from './dto';
import { Permissions } from '../share/decorators';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader', 'board:member', 'board:owner'],
    resource: 'PROJECT', // Adjust this based on requirements, this is a general read
  })
  @ApiOperation({ summary: 'Get activity logs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return paginated activity logs' })
  @Get()
  async getActivityLogs(@Query() query: QueryActivityLogsReqDto) {
    return await this.activityLogsService.getActivityLogs(query);
  }
}
