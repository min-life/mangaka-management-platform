import { Injectable, NotFoundException } from '@nestjs/common';

import { Permission, Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

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
      where.name = {
        contains: query.name.trim(),
        mode: 'insensitive',
      };
    }

    const orderBy: Prisma.PermissionOrderByWithRelationInput = {
      [query.sortBy ?? 'id']: query.order ?? 'asc',
    };

    const permissions = await this.prisma.permission.findMany({
      where,
      orderBy,
    });

    return permissions.map((permission) => this.serializePermission(permission));
  }

  async findOne(id: bigint): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        id,
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.serializePermission(permission);
  }

  private serializePermission(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id.toString(),
      name: permission.name,
      scope: permission.scope,
    };
  }
}
