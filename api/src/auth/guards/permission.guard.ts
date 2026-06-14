import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '@auth/decorators';
import { PermissionMetadata, JwtPayload } from '@auth/interfaces';
import { UsersService } from '@users/users.service';
import { AuthService } from '../auth.service';

// ChuongTV #005
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const permissionMetadata = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { id } = request?.params;
    const { userId } = request?.user as JwtPayload;
    let companyId: bigint | undefined;
    let projectId: bigint | undefined;

    if (permissionMetadata.resource) {
      if (!id) {
        return false;
      }

      const resourceScope = await this.authService.resourceResolver(
        permissionMetadata.resource,
        BigInt(id),
      );

      if (resourceScope instanceof Error) {
        throw resourceScope;
      }

      companyId = resourceScope?.companyId;
      projectId = resourceScope?.projectId;
    }

    let userPermissions = await this.usersService.getUserPermissions(userId, companyId, projectId);

    const adminPermission = await this.usersService.getAdminPermission(
      userId,
      companyId,
      projectId,
    );

    userPermissions = [...userPermissions, ...adminPermission];

    if (permissionMetadata.mode === 'ANY') {
      return permissionMetadata.permissions.some((permission) =>
        userPermissions?.includes(permission),
      );
    }

    return permissionMetadata.permissions.every((permission) =>
      userPermissions?.includes(permission),
    );
  }
}
