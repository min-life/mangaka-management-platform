import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Permission, Prisma, SCOPE } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { serializeRole } from '../share/utils/role-serializer';
import { CacheService } from '../redis/cache.service';
import { UseCache, InvalidateCache } from '../share/decorators/cache.decorator';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  @UseCache((args) => `role:list:${args[0] || 'all'}`)
  async findRoles(scope?: SCOPE) {
    try {
      const roles = await this.prisma.role.findMany({
        where: scope ? { scope } : undefined,
        orderBy: { id: 'asc' },
      });

      return { data: roles.map(serializeRole) };
    } catch (error) {
      this.handleError(error, 'Get roles fail', ERROR.SVGETROLES);
    }
  }

  @UseCache((args) => `role:${args[0]}`)
  async findOne(roleId: number) {
    try {
      const role = await this.ensureRole(roleId);
      return { data: serializeRole(role) };
    } catch (error) {
      this.handleError(error, 'Get role fail', ERROR.SVGETROLE);
    }
  }

  @InvalidateCache((args) => [`role:list:*`])
  async createRole(currentUserId: number, dto: CreateRoleDto) {
    try {
      const role = await this.prisma.$transaction(async (tx) => {
        if (dto.isDefault) {
          await tx.role.updateMany({
            where: { scope: dto.scope, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.role.create({
          data: {
            code: dto.code,
            name: dto.name,
            scope: dto.scope,
            isDefault: dto.isDefault ?? false,
            createdBy: currentUserId,
            updatedBy: currentUserId,
          },
        });
      });

      if (dto.permissionIds !== undefined) {
        await this.replacePermissions(
          role.id,
          dto.permissionIds,
        );
      }

      return { data: serializeRole(role) };
    } catch (error) {
      this.handleUniqueCodeConflict(error);
      throw error;
    }
  }

  @InvalidateCache((args) => [`role:${args[0]}`, `role:list:*`, `permission:*`])
  async updateRole(roleId: number, dto: UpdateRoleDto) {
    const currentRole = await this.ensureRole(roleId);
    const nextScope = dto.scope ?? currentRole.scope;
    const nextIsDefault = dto.isDefault ?? currentRole.isDefault;

    try {
      const role = await this.prisma.$transaction(async (tx) => {
        if (nextIsDefault) {
          await tx.role.updateMany({
            where: {
              id: { not: roleId },
              scope: nextScope,
              isDefault: true,
            },
            data: { isDefault: false },
          });
        }

        return tx.role.update({
          where: { id: roleId },
          data: {
            code: dto.code,
            name: dto.name,
            scope: dto.scope,
            isDefault: dto.isDefault,
          },
        });
      });

      if (dto.permissionIds !== undefined) {
        await this.replacePermissions(
          roleId,
          dto.permissionIds,
        );
      }

      return { data: serializeRole(role) };
    } catch (error) {
      this.handleUniqueCodeConflict(error);
      throw error;
    }
  }

  @InvalidateCache((args) => [`role:${args[0]}`, `role:list:*`, `permission:*`])
  async deleteRole(roleId: number) {
    try {
      await this.ensureRole(roleId);

      const assignedCount = await this.prisma.userRole.count({ where: { roleId } });
      const projectAssignedCount = await this.prisma.userProject.count({ where: { roleId } });

      if (assignedCount > 0 || projectAssignedCount > 0) {
        throw new ConflictException(ERROR.CFLROLEASSIGNED);
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        await tx.role.delete({ where: { id: roleId } });
      });

      return { data: { success: true } };
    } catch (error) {
      this.handleError(error, 'Delete role fail', ERROR.SVDELETEROLE);
    }
  }

  @UseCache((args) => `role:${args[0]}:permissions`)
  async findPermissions(roleId: number) {
    try {
      await this.ensureRole(roleId);

      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
        orderBy: { permissionId: 'asc' },
      });

      return {
        data: rolePermissions.map((rolePermission) =>
          this.serializePermission(rolePermission.permission),
        ),
      };
    } catch (error) {
      this.handleError(error, 'Get role permissions fail', ERROR.SVGETROLEPERMISSIONS);
    }
  }

  @InvalidateCache((args) => [`role:${args[0]}:permissions:*`, `permission:*`])
  async replacePermissions(roleId: number, permissionIds: number[]) {
    try {
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

      await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId } });

        if (uniquePermissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: uniquePermissionIds.map((permissionId) => ({
              roleId,
              permissionId,
            })),
          });
        }
      });

      return { data: { success: true } };
    } catch (error) {
      this.handleError(error, 'Replace role permissions fail', ERROR.SVUPDATEROLEPERMISSIONS);
    }
  }

  private async ensureRole(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException(ERROR.NFROLE);
    }

    return role;
  }

  private serializePermission(permission: Permission) {
    return {
      id: String(permission.id),
      name: permission.name,
      scope: permission.scope,
    };
  }

  private handleUniqueCodeConflict(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes('code')
    ) {
      throw new ConflictException(ERROR.CFROLECODE);
    }
  }

  private buildPagination(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  private buildPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
