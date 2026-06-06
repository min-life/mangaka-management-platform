import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { ProjectRolesService } from './project-roles.service';

@Controller('projects/:projectId/roles')
export class ProjectRolesController {
  constructor(private readonly projectRolesService: ProjectRolesService) {}

  @Get()
  findProjectRoles(@CurrentUser() currentUser: JwtPayload, @Param('projectId') projectId: string) {
    return this.projectRolesService.findProjectRoles(BigInt(currentUser.userId), BigInt(projectId));
  }

  @Post()
  createProjectRole(
    @CurrentUser() currentUser: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.projectRolesService.createProjectRole(
      BigInt(currentUser.userId),
      BigInt(projectId),
      dto,
    );
  }
}
