import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { PermissionResponseDto } from './dto/permission.dto';
import { PermissionFilterDto } from './dto/permission-filter.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions-response.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query: PermissionFilterDto): Promise<PermissionResponseDto[]> {
    const where: Prisma.PermissionWhereInput = {};

    if (query.scope) {
      where.scope = query.scope;
    }

    if (query.name?.trim()) {
      where.name = { contains: query.name.trim(), mode: 'insensitive' };
    }

    const permissions = await this.prisma.permission.findMany({
      where,
      orderBy: { [query.sortBy ?? 'id']: query.order ?? 'asc' },
    });

    return permissions.map((permission) => this.serializePermission(permission));
  }

  async findOne(id: number): Promise<PermissionResponseDto> {
    const permission = await this.ensurePermission(id);
    return this.serializePermission(permission);
  }

  async update(id: number, data: UpdatePermissionDto): Promise<PermissionResponseDto> {
    await this.ensurePermission(id);

    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        scope: data.scope,
        description: data.description,
      },
    });

    return this.serializePermission(permission);
  }

  async getMySysPermissions(userId: number): Promise<UserPermissionsResponseDto> {
    const permissions = await this.usersService.getUserPermissions(userId);
    return { data: permissions };
  }

  async getMyProjectPermissions(
    userId: number,
    projectId: number,
  ): Promise<UserPermissionsResponseDto> {
    const permissions = await this.usersService.getUserPermissions(userId, 'PROJECT', projectId);
    return { data: permissions };
  }

  async getMyBoardPermissions(
    userId: number,
    boardId: number,
  ): Promise<UserPermissionsResponseDto> {
    const permissions = await this.usersService.getUserPermissions(userId, 'BOARD', boardId);
    return { data: permissions };
  }

  private async ensurePermission(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });

    if (!permission) {
      throw new NotFoundException(ERROR.NFPERMISSION);
    }

    return permission;
  }

  private serializePermission(permission: Permission): PermissionResponseDto {
    return {
      id: String(permission.id),
      name: permission.name,
      scope: permission.scope,
      description: permission.description ?? undefined,
    };
  }
}
