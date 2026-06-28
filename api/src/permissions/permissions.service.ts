import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query: PermissionFilterDto): Promise<PermissionResponseDto[]> {
    try {
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
    } catch (error) {
      this.handleError(error, 'Get permissions fail', ERROR.SVGETPERMISSIONS);
    }
  }

  async findOne(id: number): Promise<PermissionResponseDto> {
    try {
      const permission = await this.ensurePermission(id);
      return this.serializePermission(permission);
    } catch (error) {
      this.handleError(error, 'Get permission fail', ERROR.SVGETPERMISSION);
    }
  }

  async update(id: number, data: UpdatePermissionDto): Promise<PermissionResponseDto> {
    try {
      await this.ensurePermission(id);

      const permission = await this.prisma.permission.update({
        where: { id },
        data: {
          scope: data.scope,
          description: data.description,
        },
      });

      return this.serializePermission(permission);
    } catch (error) {
      this.handleError(error, 'Update permission fail', ERROR.SVUPDATEPERMISSION);
    }
  }

  async getMySysPermissions(userId: number): Promise<UserPermissionsResponseDto> {
    try {
      const permissions = await this.usersService.getUserPermissions(userId);
      return { data: permissions };
    } catch (error) {
      this.handleError(error, 'Get my sys permissions fail', ERROR.SVPERMISSION);
    }
  }

  async getMyProjectPermissions(
    userId: number,
    projectId: number,
  ): Promise<UserPermissionsResponseDto> {
    try {
      const permissions = await this.usersService.getUserPermissions(userId, 'PROJECT', projectId);
      return { data: permissions };
    } catch (error) {
      this.handleError(error, 'Get my project permissions fail', ERROR.SVPERMISSION);
    }
  }

  async getMyBoardPermissions(
    userId: number,
    boardId: number,
  ): Promise<UserPermissionsResponseDto> {
    try {
      const permissions = await this.usersService.getUserPermissions(userId, 'BOARD', boardId);
      return { data: permissions };
    } catch (error) {
      this.handleError(error, 'Get my board permissions fail', ERROR.SVPERMISSION);
    }
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

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
