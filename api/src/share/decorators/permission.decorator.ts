import { SetMetadata } from '@nestjs/common';
import { PermissionMetadata } from '../../auth/interfaces';

// ChuongTV #005 start
export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (permissionMetadata: PermissionMetadata) =>
  SetMetadata(PERMISSIONS_KEY, permissionMetadata);
// ChuongTV #005 end
