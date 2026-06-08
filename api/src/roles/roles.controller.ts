import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePermissionDto } from './dto/roles.dto';
import { ROLE_PERMISSIONS } from './role-permissions';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_READ] })
  @Get('')
  findPlatformRoles() {
    return this.rolesService.findPlatformRoles();
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_CREATE] })
  @Post('/system')
  createSystemRole(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.rolesService.createPlatformRole(BigInt(currentUser.userId), dto);
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_READ] })
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(this.parseBigIntParam(id, 'id'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_UPDATE] })
  @Patch('/:id')
  updateRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(
      BigInt(currentUser.userId),
      this.parseBigIntParam(id, 'id'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.PLATFORM_ROLE_DELETE] })
  @Delete('/:id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(this.parseBigIntParam(id, 'id'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.ROLE_PERMISSION_UPDATE] })
  @Put(':roleId/permissions')
  replacePermissions(@Param('roleId') roleId: string, @Body() dto: RolePermissionDto) {
    return this.rolesService.replacePermissions(
      this.parseBigIntParam(roleId, 'roleId'),
      dto.permissionIds.map((id) => this.parseBigIntParam(id, 'permissionId')),
    );
  }

  private parseBigIntParam(value: string, paramName: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${paramName} must be a numeric string`);
    }

    return BigInt(value);
  }
}
