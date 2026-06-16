import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects() {
    return this.projectsService.getProjects();
  }

  @Post()
  async createProject(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.projectsService.createProject({ ...body, createdBy: user.userId });
  }

  @Get(':projectId')
  async getProjectById(@Param('projectId') projectId: string) {
    return this.projectsService.getProjectById(Number(projectId));
  }

  @Patch(':projectId')
  async updateProject(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return this.projectsService.updateProject(Number(projectId), {
      ...body,
      updatedBy: user.userId,
    });
  }

  @Delete(':projectId')
  async deleteProject(@Param('projectId') projectId: string) {
    return this.projectsService.deleteProject(Number(projectId));
  }

  @Put(':projectId/users/:userId/roles/:roleId')
  assignUser(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.projectsService.assignUser(
      Number(projectId),
      Number(userId),
      Number(roleId),
      user.userId,
    );
  }

  @Delete(':projectId/users/:userId/roles/:roleId')
  removeUser(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.projectsService.removeUser(Number(projectId), Number(userId), Number(roleId));
  }
}
