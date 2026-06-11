import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { CompaniesController } from '@companies/companies.controller';
import { ProjectsModule } from '@projects/projects.module';

@Module({
  imports: [ProjectsModule, RolesModule],
  providers: [],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
