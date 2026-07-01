import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiParam, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiOkResponse({ description: 'Roles retrieved successfully' })
  findRoles(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findRoles(query.scope);
  }

  @Post()
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:create'] })
  @ApiOperation({ summary: 'Create a new role' })
  @ApiOkResponse({ description: 'Role created successfully' })
  createRole(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(currentUser.userId, dto);
  }

  @Get(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:update'] })
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role updated successfully' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(Number(id), dto);
  }

  @Delete(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:delete'] })
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role deleted successfully' })
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(Number(id));
  }

  @Get(':id/permissions')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role permissions retrieved successfully' })
  findPermissions(@Param('id') id: string) {
    return this.rolesService.findPermissions(Number(id));
  }

  @Put(':id/permissions')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:update'] })
  @ApiOperation({ summary: 'Replace role permissions' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiOkResponse({ description: 'Role permissions replaced successfully' })
  replacePermissions(@Param('id') id: string, @Body() dto: ReplaceRolePermissionsDto) {
    return this.rolesService.replacePermissions(Number(id), dto.permissionIds);
  }
}
