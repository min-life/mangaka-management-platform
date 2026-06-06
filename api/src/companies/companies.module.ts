import { Module } from '@nestjs/common';
import { CompanyRolesController } from './company-roles.controller';
import { CompanyRolesService } from './company-roles.service';

@Module({
  controllers: [CompanyRolesController],
  providers: [CompanyRolesService],
})
export class CompaniesModule {}
