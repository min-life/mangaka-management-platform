import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PermissionsModule } from '@/permissions/permissions.module';

@Module({
  imports: [RolesModule, PermissionsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
