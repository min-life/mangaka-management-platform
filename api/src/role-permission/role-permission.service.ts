import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RolePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateRoleAndPermissions(roleId: bigint, permissionIds: bigint[]): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Chỉ cho phép gán permission cùng scope với role
    const invalidPermission = permissions.find((permission) => permission.scope !== role.scope);

    if (invalidPermission) {
      throw new BadRequestException('Role scope and permission scope must match');
    }
  }

  async assignPermissions(roleId: bigint, permissionIds: bigint[]) {
    await this.validateRoleAndPermissions(roleId, permissionIds);

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Permissions assigned successfully',
    };
  }

  async replacePermissions(roleId: bigint, permissionIds: bigint[]) {
    await this.validateRoleAndPermissions(roleId, permissionIds);

    // Đảm bảo role luôn ở trạng thái đồng bộ permission,
    // tránh trường hợp xóa thành công nhưng thêm mới thất bại.
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
      message: 'Permissions replaced successfully',
    };
  }

  async removePermissions(roleId: bigint, permissionIds: bigint[]) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    if (!rolePermissions.length) {
      throw new NotFoundException('Role permissions not found');
    }

    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    return {
      message: 'Permissions removed successfully',
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
      throw new BadRequestException('Role scope and permission scope must match');
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
