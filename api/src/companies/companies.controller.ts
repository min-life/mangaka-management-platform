import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '@/constants/permissions.constant';
import { CurrentUser, Permissions } from '@auth/decorators';
import type { JwtPayload } from '@auth/interfaces';
import { ProjectDataRequestDto } from '@projects/dto';
import { ProjectsService } from '@projects/projects.service';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SCOPE } from '@prisma/client';
import { PermissionFilterDto } from '../permissions/dto/permission-filter.dto';
import { parseBigIntParam } from '../utils';
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ChuongTV #007 start
  @Post('/:companyId/projects')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.CREATE_PROJECT],
  })
  async createProject(
    @CurrentUser() user: JwtPayload,
    @Param('companyId') companyId: bigint,
    @Body() projectDataDto: ProjectDataRequestDto,
  ) {
    return await this.projectsService.createProject({
      companyId,
      createdBy: user?.userId,
      name: projectDataDto.name,
    });
  }

  @Get('/:companyId/projects')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.READ_PROJECT],
  })
  async getProjects(@Param('companyId') companyId: bigint) {
    return await this.projectsService.getProjects({ companyId });
  }
  // ChuongTV #007 end

  // DongNNP #002 start
  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_READ] })
  @Get(':companyId/roles')
  findCompanyRoles(@Param('companyId') companyId: string) {
    return this.rolesService.findCompanyRoles(parseBigIntParam(companyId, 'companyId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_READ] })
  @Get(':companyId/roles/:roleId')
  findCompanyRoleDetail(@Param('companyId') companyId: string, @Param('roleId') roleId: string) {
    parseBigIntParam(companyId, 'companyId');
    return this.rolesService.findOne(parseBigIntParam(roleId, 'roleId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_CREATE] })
  @Post(':companyId/roles')
  createCompanyRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createCompanyRole(
      BigInt(currentUser.userId),
      parseBigIntParam(companyId, 'companyId'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_UPDATE] })
  @Patch(':companyId/roles/:roleId')
  updateCompanyRole(
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    parseBigIntParam(companyId, 'companyId');
    return this.rolesService.updateRole(parseBigIntParam(roleId, 'roleId'), dto);
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_DELETE] })
  @Delete(':companyId/roles/:roleId')
  deleteCompanyRole(@Param('companyId') companyId: string, @Param('roleId') roleId: string) {
    parseBigIntParam(companyId, 'companyId');
    return this.rolesService.deleteRole(parseBigIntParam(roleId, 'roleId'));
  }
  // DongNNP #002 end
  // AnhNTT #003 start
  
  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_PERMISSION_READ] })
  @Get(':companyId/permissions')
  getCompanyPermissions(
    @Param('companyId') companyId: string,
    @Query() query: PermissionFilterDto,
  ) {
    parseBigIntParam(companyId, 'companyId');

    return this.permissionsService.findAll({
      ...query,
      scope: SCOPE.CO,
    });
  }
  // AnhNTT #003 end
}
