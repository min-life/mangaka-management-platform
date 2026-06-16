import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../../share/decorators';
import { PermissionMetadata, JwtPayload } from '../interfaces';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
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
    const { userId } = request?.user as JwtPayload;
    const userPermissions = await this.usersService.getUserPermissions(userId);

    if (permissionMetadata.mode === 'ANY') {
      return permissionMetadata.permissions.some((permission) =>
        userPermissions.includes(permission),
      );
    }

    return permissionMetadata.permissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
