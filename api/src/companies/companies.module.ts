import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { CompaniesController } from '@companies/companies.controller';
import { CompaniesService } from '@companies/companies.service';
import { ProjectsModule } from '@projects/projects.module';
import { PermissionsModule } from '@/permissions/permissions.module';

@Module({
  imports: [ProjectsModule, RolesModule, PermissionsModule],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
