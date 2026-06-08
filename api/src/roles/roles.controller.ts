import { Body, Controller, Param, Put } from '@nestjs/common';

import { RolesService } from './roles.service';
import { RolePermissionDto } from './dto/roles.dto';

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
