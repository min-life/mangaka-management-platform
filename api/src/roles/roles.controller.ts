import { Body, Controller, Delete, Get, Patch, Post, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePermissionDto } from './dto/roles.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';
import { parseBigIntParam } from '../utils';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  //DongNNP #002 start

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_READ] })
  @Get('')
  findRoles(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findRoles(query.scope);
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_CREATE] })
  @Post('')
  createRole(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(BigInt(currentUser.userId), dto);
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_READ] })
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(parseBigIntParam(id, 'id'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_UPDATE] })
  @Patch('/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(parseBigIntParam(id, 'id'), dto);
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_DELETE] })
  @Delete('/:id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(parseBigIntParam(id, 'id'));
  }

  //DongNNP #002 end

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.ROLE_PERMISSION_UPDATE] })
  @Put(':roleId/permissions')
  replacePermissions(@Param('roleId') roleId: string, @Body() dto: RolePermissionDto) {
    return this.rolesService.replacePermissions(
      parseBigIntParam(roleId, 'roleId'),
      dto.permissionIds.map((id) => parseBigIntParam(id, 'permissionId')),
    );
  }
}
