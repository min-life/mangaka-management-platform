import { Body, Controller, Delete, Get, Patch, Post, Param, Query } from '@nestjs/common';
import { RoleService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  //GET /api/roles/system
  //List danh sách tất cả role cho màn hình Admin Platform
  @Get('roles/system')
  findPlatformRoles(@Query('currentUserId') currentUserId: string) {
    return this.roleService.findPlatformRoles(BigInt(currentUserId));
  }
}
