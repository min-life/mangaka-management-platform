import { Body, Controller, Delete, Get, Patch, Post, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RolesService } from './roles.service';
import { RolePermissionDto } from './dto/roles.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';
import { parseBigIntParam } from '../utils';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolePermissionService: RolesService) {}

  @Put(':roleId/permissions')
  replacePermissions(@Param('roleId') roleId: string, @Body() dto: RolePermissionDto) {
    return this.rolePermissionService.replacePermissions(
      BigInt(roleId),
      dto.permissionIds.map((id) => BigInt(id)),
    );
  }
}
