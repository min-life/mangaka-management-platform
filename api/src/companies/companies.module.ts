import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { CompaniesController } from '@companies/companies.controller';
import { CompaniesService } from '@companies/companies.service';
import { ProjectsModule } from '@projects/projects.module';

@Module({
  imports: [ProjectsModule, RolesModule],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
