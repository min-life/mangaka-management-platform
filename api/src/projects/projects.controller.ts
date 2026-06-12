import { Body, Controller, Delete, Get, Param, Put, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@/constants/permissions.constant';
import { CurrentUser, Permissions } from '@auth/decorators';
import type { JwtPayload } from '@auth/interfaces';
import { ProjectsService } from '@projects/projects.service';
import { ProjectDataRequestDto } from './dto';
import { ROLE_PERMISSIONS } from '../roles/constants/role-permissions';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { RolesService } from '../roles/roles.service';
import { parseBigIntParam } from '../utils';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly rolesService: RolesService,
  ) {}

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

  // DongNNP #002 start
  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_READ] })
  @Get(':projectId/roles')
  findProjectRoles(@Param('projectId') projectId: string) {
    return this.rolesService.findProjectRoles(parseBigIntParam(projectId, 'projectId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_READ] })
  @Get(':projectId/roles/:roleId')
  findProjectRoleDetail(@Param('projectId') projectId: string, @Param('roleId') roleId: string) {
    parseBigIntParam(projectId, 'projectId');
    return this.rolesService.findOne(parseBigIntParam(roleId, 'roleId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_CREATE] })
  @Post(':projectId/roles')
  createProjectRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createProjectRole(
      BigInt(currentUser.userId),
      parseBigIntParam(projectId, 'projectId'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_UPDATE] })
  @Patch(':projectId/roles/:roleId')
  updateProjectRole(
    @Param('projectId') projectId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    parseBigIntParam(projectId, 'projectId');
    return this.rolesService.updateRole(parseBigIntParam(roleId, 'roleId'), dto);
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_DELETE] })
  @Delete(':projectId/roles/:roleId')
  deleteProjectRole(@Param('projectId') projectId: string, @Param('roleId') roleId: string) {
    parseBigIntParam(projectId, 'projectId');
    return this.rolesService.deleteRole(parseBigIntParam(roleId, 'roleId'));
  }
  // DongNNP #002 end
}
