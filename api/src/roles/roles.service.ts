import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateRoleAndPermissions(roleId: bigint, permissionIds: bigint[]): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    // Role phải tồn tại
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

    // Tất cả permission phải tồn tại trong hệ thống
    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Invalid permissions');
    }

    // Permission phải cùng scope với role
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

  // clone permission từ role cũ sang role mới
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

    // Không cho phép clone permission giữa các scope khác nhau
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
