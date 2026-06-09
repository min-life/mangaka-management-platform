import { Injectable } from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLE_MESSAGES } from '../roles/constants/role-messages';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { serializeRole } from '../roles/utils/role-serializer';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findProjectRoles(projectId: bigint) {
    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.PRJ,
        projectId,
      },
    });

    return {
      message: ROLE_MESSAGES.PROJECT_ROLES_FOUND,
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async createProjectRole(currentUserId: bigint, projectId: bigint, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        scope: SCOPE.PRJ,
        companyId: null,
        projectId,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });

    return {
      message: ROLE_MESSAGES.PROJECT_ROLE_CREATED,
      data: serializeRole(role),
    };
  }
}
