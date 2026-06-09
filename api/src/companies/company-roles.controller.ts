import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { ROLE_PERMISSIONS } from '../roles/constants/role-permissions';
import { CompanyRolesService } from './company-roles.service';

@Controller('companies/:companyId/roles')
export class CompanyRolesController {
  constructor(private readonly companyRolesService: CompanyRolesService) {}

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_READ] })
  @Get()
  findCompanyRoles(@Param('companyId') companyId: string) {
    return this.companyRolesService.findCompanyRoles(this.parseBigIntParam(companyId, 'companyId'));
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_READ] })
  @Get(':roleId')
  findCompanyRoleDetail(@Param('companyId') companyId: string, @Param('roleId') roleId: string) {
    return this.companyRolesService.findCompanyRoleDetail(
      this.parseBigIntParam(companyId, 'companyId'),
      this.parseBigIntParam(roleId, 'roleId'),
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_CREATE] })
  @Post()
  createCompanyRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.companyRolesService.createCompanyRole(
      BigInt(currentUser.userId),
      this.parseBigIntParam(companyId, 'companyId'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_UPDATE] })
  @Patch(':roleId')
  updateCompanyRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.companyRolesService.updateCompanyRole(
      BigInt(currentUser.userId),
      this.parseBigIntParam(companyId, 'companyId'),
      this.parseBigIntParam(roleId, 'roleId'),
      dto,
    );
  }

  @Permissions({ mode: 'ALL', permissions: [ROLE_PERMISSIONS.COMPANY_ROLE_DELETE] })
  @Delete(':roleId')
  deleteCompanyRole(@Param('companyId') companyId: string, @Param('roleId') roleId: string) {
    return this.companyRolesService.deleteCompanyRole(
      this.parseBigIntParam(companyId, 'companyId'),
      this.parseBigIntParam(roleId, 'roleId'),
    );
  }

  private parseBigIntParam(value: string, paramName: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${paramName} must be a numeric string`);
    }

    return BigInt(value);
  }
}
