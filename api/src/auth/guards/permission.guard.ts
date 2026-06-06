import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '@auth/decorators';
import { PermissionMetadata, JwtPayload } from '@auth/interfaces';

// ChuongTV #005
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const publicHandler = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (publicHandler) {
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

    const user = request.user as JwtPayload;

    const userPermissions = user?.permissions;

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
