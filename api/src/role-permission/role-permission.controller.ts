import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';

import { RolePermissionService } from './role-permission.service';
import { RolePermissionDto } from './dto/role-permission.dto';

@Controller('roles')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post(':roleId/permissions')
  assignPermissions(@Param('roleId') roleId: string, @Body() dto: RolePermissionDto) {
    return this.rolePermissionService.assignPermissions(
      BigInt(roleId),
      dto.permissionIds.map((id) => BigInt(id)),
    );
  }

  @Put(':roleId/permissions')
  replacePermissions(@Param('roleId') roleId: string, @Body() dto: RolePermissionDto) {
    return this.rolePermissionService.replacePermissions(
      BigInt(roleId),
      dto.permissionIds.map((id) => BigInt(id)),
    );
  }

  @Delete(':roleId/permissions')
  removePermissions(@Param('roleId') roleId: string, @Body() dto: RolePermissionDto) {
    return this.rolePermissionService.removePermissions(
      BigInt(roleId),
      dto.permissionIds.map((id) => BigInt(id)),
    );
  }
}
