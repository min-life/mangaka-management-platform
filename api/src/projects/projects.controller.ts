import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { PERMISSIONS } from '@/constants/permissions.constant';
import { CurrentUser, Permissions } from '@auth/decorators';
import type { JwtPayload } from '@auth/interfaces';
import { ProjectsService } from '@projects/projects.service';
import { ProjectDataRequestDto } from './dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ChuongTV #007 start
  @Get('/:projectId')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.READ_PROJECT],
  })
  async getProjectById(@Param('projectId') projectId: bigint) {
    return await this.projectsService.getProjectById(projectId);
  }

  @Delete('/:projectId')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.DELETE_PROJECT],
  })
  async deleteProject(@Param('projectId') projectId: bigint) {
    return await this.projectsService.deleteProject(projectId);
  }

  @Put('/:projectId')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.UPDATE_PROJECT],
  })
  async updateProject(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: bigint,
    @Body() updateProjectDto: ProjectDataRequestDto,
  ) {
    return await this.projectsService.updateProject(projectId, {
      name: updateProjectDto.name,
      updatedBy: user?.userId,
    });
  }
  // ChuongTV #007 end
}
