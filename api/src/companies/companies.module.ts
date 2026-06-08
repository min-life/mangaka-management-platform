import { Module } from '@nestjs/common';
import { CompaniesController } from '@companies/companies.controller';
import { ProjectsModule } from '@projects/projects.module';

@Module({
  imports: [ProjectsModule],
  providers: [],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
