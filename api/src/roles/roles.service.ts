import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { serializeRole } from '../share/utils/role-serializer';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findRoles(scope?: SCOPE) {
    const roles = await this.prisma.role.findMany({
      where: scope ? { scope } : undefined,
      orderBy: { id: 'asc' },
    });

    return { data: roles.map(serializeRole) };
  }

  async findOne(roleId: number) {
    const role = await this.ensureRole(roleId);
    return { data: serializeRole(role) };
  }

  async createRole(currentUserId: number, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        code: dto.code,
        name: dto.name,
        scope: dto.scope ?? SCOPE.SYS,
        isDefault: dto.isDefault ?? false,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });

    return { data: serializeRole(role) };
  }

  async updateRole(roleId: number, dto: UpdateRoleDto) {
    await this.ensureRole(roleId);

    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        code: dto.code,
        name: dto.name,
        scope: dto.scope,
        isDefault: dto.isDefault,
      },
    });

    if (dto.permissionIds !== undefined) {
      await this.replacePermissions(
        roleId,
        dto.permissionIds.map((id) => Number(id)),
      );
    }

    return { data: serializeRole(role) };
  }

  async deleteRole(roleId: number) {
    await this.ensureRole(roleId);

    const assignedCount = await this.prisma.userRole.count({ where: { roleId } });
    const projectAssignedCount = await this.prisma.userProject.count({ where: { roleId } });

    if (assignedCount > 0 || projectAssignedCount > 0) {
      throw new ConflictException(ERROR.EVLROLEASSIGNED);
    }

    await this.prisma.role.delete({ where: { id: roleId } });

    return { data: { success: true } };
  }

  async replacePermissions(roleId: number, permissionIds: number[]) {
    const role = await this.ensureRole(roleId);
    const uniquePermissionIds = [...new Set(permissionIds)];

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: uniquePermissionIds } },
    });

    if (permissions.length !== uniquePermissionIds.length) {
      throw new BadRequestException(ERROR.EVLPERMISSIONSCOPE);
    }

    if (permissions.some((permission) => permission.scope !== role.scope)) {
      throw new BadRequestException(ERROR.EVLPERMISSIONSCOPE);
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: uniquePermissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      }),
    ]);

    return { data: { success: true } };
  }

  private async ensureRole(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException(ERROR.NFROLE);
    }

    return role;
  }
}
