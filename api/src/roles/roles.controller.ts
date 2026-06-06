import { Body, Controller, Delete, Get, Patch, Post, Param, Query } from '@nestjs/common';
import { RoleService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('roles/system')
  findPlatformRoles(@Query('currentUserId') currentUserId: string) {
    return this.roleService.findPlatformRoles(BigInt(currentUserId));
  }

  @Post('roles/system')
  createSystemRole(@Query('currentUserId') currentUserId: string, @Body() dto: CreateRoleDto) {
    return this.roleService.createPlatformRole(BigInt(currentUserId), dto);
  }

  @Get('companies/:companyId/roles')
  findCompanyRoles(
    @Query('currentUserId') currentUserId: string,
    @Param('companyId') companyId: string,
  ) {
    return this.roleService.findCompanyRoles(BigInt(currentUserId), BigInt(companyId));
  }

  @Post('companies/:companyId/roles')
  createCompanyRole(
    @Query('currentUserId') currentUserId: string,
    @Param('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.roleService.createCompanyRole(BigInt(currentUserId), BigInt(companyId), dto);
  }

  @Get('projects/:projectId/roles')
  findProjectRoles(
    @Query('currentUserId') currentUserId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.roleService.findProjectRoles(BigInt(currentUserId), BigInt(projectId));
  }

  @Post('projects/:projectId/roles')
  createProjectRole(
    @Query('currentUserId') currentUserId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.roleService.createProjectRole(BigInt(currentUserId), BigInt(projectId), dto);
  }

  @Get('roles/:id')
  findOne(@Query('currentUserId') currentUserId: string, @Param('id') id: string) {
    return this.roleService.findOne(BigInt(currentUserId), BigInt(id));
  }

  @Patch('roles/:id')
  updateRole(
    @Query('currentUserId') currentUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(BigInt(currentUserId), BigInt(id), dto);
  }

  @Delete('roles/:id')
  deleteRole(@Query('currentUserId') currentUserId: string, @Param('id') id: string) {
    return this.roleService.deleteRole(BigInt(currentUserId), BigInt(id));
  }
}
