import { Body, Controller, Delete, Get, Patch, Post, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RoleService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('roles')
  findPlatformRoles(@CurrentUser() currentUser: JwtPayload) {
    return this.roleService.findPlatformRoles(BigInt(currentUser.userId));
  }

  @Post('roles/system')
  createSystemRole(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.roleService.createPlatformRole(BigInt(currentUser.userId), dto);
  }

  @Get('roles/:id')
  findOne(@CurrentUser() currentUser: JwtPayload, @Param('id') id: string) {
    return this.roleService.findOne(BigInt(currentUser.userId), BigInt(id));
  }

  @Patch('roles/:id')
  updateRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(BigInt(currentUser.userId), BigInt(id), dto);
  }

  @Delete('roles/:id')
  deleteRole(@CurrentUser() currentUser: JwtPayload, @Param('id') id: string) {
    return this.roleService.deleteRole(BigInt(currentUser.userId), BigInt(id));
  }
}
