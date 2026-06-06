import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ROLE_MESSAGES } from './role-messages';
import { serializeRole } from './role-serializer';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanManagePlatformRoles(currentUserId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.SYS,
          code: 'admin',
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_MANAGE_PLATFORM_ROLES);
    }
  }

  private async assertCanAccessCompanyRoles(currentUserId: bigint, companyId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          OR: [
            {
              scope: SCOPE.CO,
              code: 'co_admin',
              companyId,
            },
            {
              scope: SCOPE.PRJ,
              project: {
                companyId,
              },
            },
          ],
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_ACCESS_COMPANY);
    }
  }

  private async assertCanManageCompanyRoles(currentUserId: bigint, companyId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.CO,
          companyId,
          code: 'co_admin',
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_MANAGE_COMPANY_ROLES);
    }
  }

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

  private async assertCanAccessRole(
    currentUserId: bigint,
    role: Prisma.RoleGetPayload<{ include: { project: true } }>,
  ) {
    if (role.scope === SCOPE.SYS) {
      await this.assertCanManagePlatformRoles(currentUserId);
      return;
    }

    if (role.scope === SCOPE.CO) {
      if (!role.companyId) {
        return;
      }

      await this.assertCanAccessCompanyRoles(currentUserId, role.companyId);
      return;
    }

    if (role.scope === SCOPE.PRJ) {
      if (!role.projectId) {
        return;
      }

      await this.assertCanAccessProjectRoles(currentUserId, role.projectId);
    }
  }

  private async assertCanManageRole(
    currentUserId: bigint,
    role: Prisma.RoleGetPayload<{ include: { project: true } }>,
  ) {
    if (role.scope === SCOPE.SYS) {
      await this.assertCanManagePlatformRoles(currentUserId);
      return;
    }

    if (role.scope === SCOPE.CO) {
      if (!role.companyId) {
        throw new BadRequestException(ROLE_MESSAGES.INVALID_COMPANY_ROLE);
      }

      await this.assertCanManageCompanyRoles(currentUserId, role.companyId);
      return;
    }

    if (role.scope === SCOPE.PRJ) {
      if (!role.projectId) {
        throw new BadRequestException(ROLE_MESSAGES.INVALID_PROJECT_ROLE);
      }

      await this.assertCanManageProjectRoles(currentUserId, role.projectId);
    }
  }

  async findPlatformRoles(currentUserId: bigint) {
    await this.assertCanManagePlatformRoles(currentUserId);

    const roles = await this.prisma.role.findMany({
      where: {
        OR: [
          {
            scope: SCOPE.SYS,
          },
          {
            scope: SCOPE.CO,
            companyId: null,
            projectId: null,
          },
          {
            scope: SCOPE.PRJ,
            companyId: null,
            projectId: null,
          },
        ],
      },
    });

    return {
      message: ROLE_MESSAGES.PLATFORM_ROLES_FOUND,
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async findOne(currentUserId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { project: true },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    await this.assertCanAccessRole(currentUserId, role);

    return {
      message: ROLE_MESSAGES.ROLE_FOUND,
      data: serializeRole(role),
    };
  }

  async createPlatformRole(currentUserId: bigint, dto: CreateRoleDto) {
    await this.assertCanManagePlatformRoles(currentUserId);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        scope: dto.scope ?? SCOPE.SYS,
        companyId: null,
        projectId: null,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });

    return {
      message: ROLE_MESSAGES.PLATFORM_ROLE_CREATED,
      data: serializeRole(role),
    };
  }

  async updateRole(currentUserId: bigint, roleId: bigint, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      include: {
        project: true,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    await this.assertCanManageRole(currentUserId, role);

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        code: dto.code,
        updatedBy: currentUserId,
      },
    });

    return {
      message: ROLE_MESSAGES.ROLE_UPDATED,
      data: serializeRole(updatedRole),
    };
  }

  async deleteRole(currentUserId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      include: {
        project: true,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    await this.assertCanManageRole(currentUserId, role);

    const assignedCount = await this.prisma.userRole.count({
      where: { roleId },
    });

    if (assignedCount > 0) {
      throw new ConflictException(ROLE_MESSAGES.ASSIGNED_ROLE_DELETE_CONFLICT);
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return {
      message: ROLE_MESSAGES.ROLE_DELETED,
      data: {
        success: true,
      },
    };
  }
}
