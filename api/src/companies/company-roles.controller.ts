import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { CompanyRolesService } from './company-roles.service';

@Controller('companies/:companyId/roles')
export class CompanyRolesController {
  constructor(private readonly companyRolesService: CompanyRolesService) {}

  @Get()
  findCompanyRoles(@CurrentUser() currentUser: JwtPayload, @Param('companyId') companyId: string) {
    return this.companyRolesService.findCompanyRoles(BigInt(currentUser.userId), BigInt(companyId));
  }

  @Post()
  createCompanyRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.companyRolesService.createCompanyRole(
      BigInt(currentUser.userId),
      BigInt(companyId),
      dto,
    );
  }
}
