import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../share/decorators';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PermissionsService } from './permissions.service';
import { PermissionFilterDto } from './dto/permission-filter.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions-response.dto';

@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions({ mode: 'ANY', permissions: ['admin', 'permission:read'] })
  findAll(@Query() query: PermissionFilterDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'permission:read'] })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'permission:update'] })
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(Number(id), dto);
  }

  @Get('me/sys')
  @ApiOperation({ summary: 'Get current user global permissions' })
  @ApiOkResponse({ type: UserPermissionsResponseDto })
  getMySysPermissions(@CurrentUser() currentUser: JwtPayload) {
    return this.permissionsService.getMySysPermissions(currentUser.userId);
  }

  @Get('me/projects/:id')
  @ApiOperation({ summary: 'Get current user permissions for a specific project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project ID' })
  @ApiOkResponse({ type: UserPermissionsResponseDto })
  getMyProjectPermissions(@CurrentUser() currentUser: JwtPayload, @Param('id') id: string) {
    return this.permissionsService.getMyProjectPermissions(currentUser.userId, Number(id));
  }

  @Get('me/boards/:id')
  @ApiOperation({ summary: 'Get current user permissions for a specific board' })
  @ApiParam({ name: 'id', type: Number, description: 'Board ID' })
  @ApiOkResponse({ type: UserPermissionsResponseDto })
  getMyBoardPermissions(@CurrentUser() currentUser: JwtPayload, @Param('id') id: string) {
    return this.permissionsService.getMyBoardPermissions(currentUser.userId, Number(id));
  }
}
