import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ROLE_MESSAGES } from './role-messages';
import { serializeRole } from './role-serializer';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPlatformRoles() {
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

  async findOne(roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          {
            scope: SCOPE.SYS,
          },
          {
            companyId: null,
            projectId: null,
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

  async createPlatformRole(currentUserId: bigint, dto: CreateRoleDto) {
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
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          {
            scope: SCOPE.SYS,
          },
          {
            companyId: null,
            projectId: null,
          },
        ],
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

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

  async deleteRole(roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          {
            scope: SCOPE.SYS,
          },
          {
            companyId: null,
            projectId: null,
          },
        ],
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

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

  private async validateRoleAndPermissions(roleId: bigint, permissionIds: bigint[]): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new BadRequestException('Invalid permissions');
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Invalid permissions');
    }

    const hasInvalidScope = permissions.some((permission) => permission.scope !== role.scope);

    if (hasInvalidScope) {
      throw new BadRequestException('Invalid permissions');
    }
  }

  async replacePermissions(roleId: bigint, permissionIds: bigint[]) {
    await this.validateRoleAndPermissions(roleId, permissionIds);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: {
          roleId,
        },
      }),

      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      }),
    ]);

    return {
      message: 'Permissions updated successfully',
    };
  }

  async clonePermissions(sourceRoleId: bigint, targetRoleId: bigint) {
    const sourceRole = await this.prisma.role.findUnique({
      where: {
        id: sourceRoleId,
      },
    });

    if (!sourceRole) {
      throw new NotFoundException('Source role not found');
    }

    const targetRole = await this.prisma.role.findUnique({
      where: {
        id: targetRoleId,
      },
    });

    if (!targetRole) {
      throw new NotFoundException('Target role not found');
    }

    if (sourceRole.scope !== targetRole.scope) {
      throw new BadRequestException('Invalid role scope');
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: sourceRoleId,
      },
    });

    if (!rolePermissions.length) {
      return {
        message: 'Source role has no permissions',
      };
    }

    await this.prisma.rolePermission.createMany({
      data: rolePermissions.map((rolePermission) => ({
        roleId: targetRoleId,
        permissionId: rolePermission.permissionId,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Permissions cloned successfully',
    };
  }
}
