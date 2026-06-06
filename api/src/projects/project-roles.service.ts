import { ForbiddenException, Injectable } from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { ROLE_MESSAGES } from '../roles/role-messages';
import { serializeRole } from '../roles/role-serializer';

@Injectable()
export class ProjectRolesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanAccessProjectRoles(currentUserId: bigint, projectId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.PRJ,
          projectId,
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_ACCESS_PROJECT);
    }
  }

  private async assertCanManageProjectRoles(currentUserId: bigint, projectId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.PRJ,
          projectId,
          code: 'manager',
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_MANAGE_PROJECT_ROLES);
    }
  }

  async findProjectRoles(currentUserId: bigint, projectId: bigint) {
    await this.assertCanAccessProjectRoles(currentUserId, projectId);

    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.PRJ,
        OR: [
          {
            companyId: null,
            projectId: null,
          },
          {
            projectId,
          },
        ],
      },
    });

    return {
      message: ROLE_MESSAGES.PROJECT_ROLES_FOUND,
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async createProjectRole(currentUserId: bigint, projectId: bigint, dto: CreateRoleDto) {
    await this.assertCanManageProjectRoles(currentUserId, projectId);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
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
