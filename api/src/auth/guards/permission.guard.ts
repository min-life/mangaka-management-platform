import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../../share/decorators';
import { PermissionMetadata, JwtPayload, Resource } from '../interfaces';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const permissionMetadata = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || !permissionMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { userId } = request?.user as JwtPayload;
    const resource = permissionMetadata.resource as Resource | undefined;
    const resourceId = request?.params?.['id'] as number | undefined;

    console.log(resource, resourceId);

    const userPermissions = await this.userService.getUserPermissions(
      userId,
      resource,
      Number(resourceId),
    );

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
