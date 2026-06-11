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
import { ROLE_MESSAGES } from './constants/role-messages';
import { serializeRole } from './utils/role-serializer';
import { parseBigIntParam } from '@/utils';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // DongNNP #002 start
  async findRoles(scope?: SCOPE) {
    const roles = await this.prisma.role.findMany({
      where: {
        ...(scope ? { scope } : {}),
      },
    });

    return {
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async findCompanyRoles(companyId: bigint) {
    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.CO,
        companyId,
      },
    });

    return {
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async findProjectRoles(projectId: bigint) {
    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.PRJ,
        projectId,
      },
    });

    return {
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async findOne(roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    return {
      data: serializeRole(role),
    };
  }

  async createRole(currentUserId: bigint, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        scope: dto.scope,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });

    return {
      data: serializeRole(role),
    };
  }

  async createCompanyRole(currentUserId: bigint, companyId: bigint, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        scope: SCOPE.CO,
        companyId,
        projectId: null,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });

    return {
      data: serializeRole(role),
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
      data: serializeRole(role),
    };
  }

  async updateRole(roleId: bigint, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        scope: dto.scope,
      },
    });

    if (dto.permissionIds !== undefined) {
      await this.replacePermissions(
        roleId,
        dto.permissionIds.map((id) => parseBigIntParam(id, 'permissionId')),
      );
    }

    return {
      data: serializeRole(updatedRole),
    };
  }

  async deleteRole(roleId: bigint) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
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
      data: {
        success: true,
      },
    };
  }
  //DongNNP #002 end

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

    return;
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

    return;
  }
}
