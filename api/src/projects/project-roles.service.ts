import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { ROLE_MESSAGES } from '../roles/constants/role-messages';
import { serializeRole } from '../roles/utils/role-serializer';

@Injectable()
export class ProjectRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findProjectRoles(projectId: bigint) {
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

  async findProjectRoleDetail(projectId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
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

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    return {
      message: ROLE_MESSAGES.ROLE_FOUND,
      data: serializeRole(role),
    };
  }

  async updateProjectRole(
    currentUserId: bigint,
    projectId: bigint,
    roleId: bigint,
    dto: UpdateRoleDto,
  ) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        scope: SCOPE.PRJ,
        projectId,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    const updatedRole = await this.prisma.role.update({
      where: {
        id: roleId,
      },
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

  async deleteProjectRole(projectId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        scope: SCOPE.PRJ,
        projectId,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    if (!role.projectId) {
      throw new BadRequestException(ROLE_MESSAGES.INVALID_PROJECT_ROLE);
    }

    const assignedCount = await this.prisma.userRole.count({
      where: {
        roleId,
      },
    });

    if (assignedCount > 0) {
      throw new ConflictException(ROLE_MESSAGES.ASSIGNED_ROLE_DELETE_CONFLICT);
    }

    await this.prisma.role.delete({
      where: {
        id: roleId,
      },
    });

    return {
      message: ROLE_MESSAGES.ROLE_DELETED,
      data: {
        success: true,
      },
    };
  }
}
