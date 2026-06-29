import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../share/decorators';
import { ProjectStatsService } from './project-stats.service';
import { ProjectStatResponseDto, UpdateProjectStatReqDto } from './dto';

@ApiTags('Project Stats')
@ApiBearerAuth()
@Controller('project-stats')
export class ProjectStatsController {
  constructor(private readonly projectStatsService: ProjectStatsService) { }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'PROJECT_STAT',
  })
  @ApiOperation({ summary: 'Get project stat details' })
  @ApiParam({ name: 'id', type: Number, description: 'Project stat id' })
  @ApiOkResponse({
    description: 'Project stat retrieved successfully',
    type: ProjectStatResponseDto,
  })
  @Get(':id')
  async getProjectStatById(@Param('id', ParseIntPipe) id: number) {
    const projectStat = await this.projectStatsService.getProjectStatById(id);
    return {
      data: projectStat,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:update', 'board:leader'],
    resource: 'PROJECT_STAT',
  })
  @ApiOperation({ summary: 'Update project stat' })
  @ApiParam({ name: 'id', type: Number, description: 'Project stat id' })
  @ApiOkResponse({ description: 'Project stat updated successfully', type: ProjectStatResponseDto })
  @Patch(':id')
  async updateProjectStat(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProjectStatReqDto,
  ) {
    const projectStat = await this.projectStatsService.updateProjectStat(id, data);
    return {
      data: projectStat,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:delete', 'board:leader'],
    resource: 'PROJECT_STAT',
  })
  @ApiOperation({ summary: 'Delete project stat' })
  @ApiParam({ name: 'id', type: Number, description: 'Project stat id' })
  @ApiOkResponse({ description: 'Project stat deleted successfully' })
  @Delete(':id')
  async deleteProjectStat(@Param('id', ParseIntPipe) id: number) {
    await this.projectStatsService.deleteProjectStat(id);
  }
}
