import { Module } from '@nestjs/common';
import { ProjectRolesController } from './project-roles.controller';
import { ProjectRolesService } from './project-roles.service';

@Module({
  controllers: [ProjectRolesController],
  providers: [ProjectRolesService],
})
export class ProjectsModule {}
