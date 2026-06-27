'use client';

import type { ReactNode } from 'react';

import { usePermissions } from '@/hooks/use-permissions';
import type { PermissionName, PermissionResource } from '@/types/permission';

type CanProps = {
  all?: PermissionName[];
  any?: PermissionName[];
  children: ReactNode;
  fallback?: ReactNode;
  permission?: PermissionName;
  resource?: PermissionResource;
  resourceId?: number | string;
};

export function Can({
  all,
  any,
  children,
  fallback = null,
  permission,
  resource = 'SYS',
  resourceId,
}: CanProps) {
  const { can, canAll, canAny, isLoading } = usePermissions({ resource, resourceId });

  if (isLoading) {
    return fallback;
  }

  if (permission && can(permission)) {
    return children;
  }

  if (any?.length && canAny(any)) {
    return children;
  }

  if (all?.length && canAll(all)) {
    return children;
  }

  return fallback;
}
