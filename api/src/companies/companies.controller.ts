import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { RolesService } from '../roles/roles.service';
import { parseBigIntParam } from '../utils';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  findCompanies() {
    return this.companiesService.findCompanies();
  }

  @Post()
  createCompany(@CurrentUser() currentUser: JwtPayload, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(BigInt(currentUser.userId), dto);
  }

  @Get(':companyId')
  findCompany(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyById(parseBigIntParam(companyId, 'companyId'));
  }

  @Patch(':companyId')
  updateCompany(
    @CurrentUser() currentUser: JwtPayload,
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(
      BigInt(currentUser.userId),
      parseBigIntParam(companyId, 'companyId'),
      dto,
    );
  }

  @Delete(':companyId')
  deleteCompany(@Param('companyId') companyId: string) {
    return this.companiesService.deleteCompany(parseBigIntParam(companyId, 'companyId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_READ] })
  @Get(':companyId/roles')
  findCompanyRoles(@Param('companyId') companyId: string) {
    return this.companiesService.findCompanyRoles(parseBigIntParam(companyId, 'companyId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_READ] })
  @Get(':companyId/roles/:roleId')
  findCompanyRoleDetail(@Param('companyId') companyId: string, @Param('roleId') roleId: string) {
    parseBigIntParam(companyId, 'companyId');
    return this.rolesService.getRoleById(parseBigIntParam(roleId, 'roleId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_CREATE] })
  @Post(':companyId/roles')
  createCompanyRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.companiesService.createCompanyRole(
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
}
