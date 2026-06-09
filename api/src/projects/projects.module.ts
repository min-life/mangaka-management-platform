import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [RolesModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
