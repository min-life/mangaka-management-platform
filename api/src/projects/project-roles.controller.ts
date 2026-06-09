import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { ROLE_PERMISSIONS } from '../roles/constants/role-permissions';
import { ProjectRolesService } from './project-roles.service';

@Controller('projects/:projectId/roles')
export class ProjectRolesController {
  constructor(private readonly projectRolesService: ProjectRolesService) {}

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_READ] })
  @Get()
  findProjectRoles(@Param('projectId') projectId: string) {
    return this.projectRolesService.findProjectRoles(this.parseBigIntParam(projectId, 'projectId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_READ] })
  @Get(':roleId')
  findProjectRoleDetail(@Param('projectId') projectId: string, @Param('roleId') roleId: string) {
    return this.projectRolesService.findProjectRoleDetail(
      this.parseBigIntParam(projectId, 'projectId'),
      this.parseBigIntParam(roleId, 'roleId'),
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_CREATE] })
  @Post()
  createProjectRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.projectRolesService.createProjectRole(
      BigInt(currentUser.userId),
      this.parseBigIntParam(projectId, 'projectId'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_UPDATE] })
  @Patch(':roleId')
  updateProjectRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.projectRolesService.updateProjectRole(
      BigInt(currentUser.userId),
      this.parseBigIntParam(projectId, 'projectId'),
      this.parseBigIntParam(roleId, 'roleId'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PROJECT_ROLE_DELETE] })
  @Delete(':roleId')
  deleteProjectRole(@Param('projectId') projectId: string, @Param('roleId') roleId: string) {
    return this.projectRolesService.deleteProjectRole(
      this.parseBigIntParam(projectId, 'projectId'),
      this.parseBigIntParam(roleId, 'roleId'),
    );
  }

  private parseBigIntParam(value: string, paramName: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${paramName} must be a numeric string`);
    }

    return BigInt(value);
  }
}
