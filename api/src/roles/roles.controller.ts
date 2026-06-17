import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  findRoles(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findRoles(query.scope);
  }

  @Post()
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:create'] })
  createRole(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(currentUser.userId, dto);
  }

  @Get(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:update'] })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(Number(id), dto);
  }

  @Delete(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:delete'] })
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(Number(id));
  }

  @Get(':id/permissions')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  findPermissions(@Param('id') id: string) {
    return this.rolesService.findPermissions(Number(id));
  }

  @Put(':id/permissions')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:update'] })
  replacePermissions(@Param('id') id: string, @Body() dto: ReplaceRolePermissionsDto) {
    return this.rolesService.replacePermissions(Number(id), dto.permissionIds);
  }
}
