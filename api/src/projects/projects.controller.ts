import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { RolesService } from '../roles/roles.service';
import { parseBigIntParam } from '../utils';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly rolesService: RolesService) {}

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
}
