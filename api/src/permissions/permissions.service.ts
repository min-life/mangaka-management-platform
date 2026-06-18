import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Permission, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { PermissionResponseDto } from './dto/permission.dto';
import { PermissionFilterDto } from './dto/permission-filter.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(data: { name: string; scope?: any }) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name: data.name },
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    const permission = await this.prisma.permission.create({
      data: {
        name: data.name,
        scope: data.scope,
      },
    });

    return this.serializePermission(permission);
  }

  async update(id: number, data: { name?: string; scope?: any }) {
    await this.ensurePermission(id);

    const permission = await this.prisma.permission.update({
      where: { id },
      data,
    });

    return this.serializePermission(permission);
  }

  async delete(id: number) {
    await this.ensurePermission(id);
    await this.prisma.permission.delete({ where: { id } });
    return { data: { success: true } };
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
    };
  }
}
