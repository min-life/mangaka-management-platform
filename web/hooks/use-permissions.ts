'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getMyPermissions } from '@/services/permission.service';
import type { PermissionName, PermissionResource } from '@/types/permission';

type UsePermissionsOptions = {
  enabled?: boolean;
  resource?: PermissionResource;
  resourceId?: number | string;
};

type PermissionStatus = 'error' | 'idle' | 'loading' | 'success';

const permissionCache = new Map<string, PermissionName[]>();

function getPermissionKey(userId: number | string | undefined, resource: PermissionResource, resourceId?: number | string) {
  const scopeKey = resource === 'SYS' ? 'SYS' : `${resource}:${resourceId ?? ''}`;
  return `${userId ?? 'anonymous'}:${scopeKey}`;
}

export function usePermissions({
  enabled = true,
  resource = 'SYS',
  resourceId,
}: UsePermissionsOptions = {}) {
  const { status: authStatus, user } = useAuth();
  const key = getPermissionKey(user?.id, resource, resourceId);
  const shouldFetch =
    enabled && authStatus === 'authenticated' && (resource === 'SYS' || Boolean(resourceId));
  const [permissions, setPermissions] = useState<PermissionName[]>(() => permissionCache.get(key) ?? []);
  const [status, setStatus] = useState<PermissionStatus>(() =>
    permissionCache.has(key) ? 'success' : shouldFetch ? 'loading' : 'idle',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!shouldFetch) {
      return () => {
        isMounted = false;
      };
    }

    const cachedPermissions = permissionCache.get(key);
    if (cachedPermissions) {
      queueMicrotask(() => {
        if (!isMounted) {
          return;
        }

        setPermissions(cachedPermissions);
        setStatus('success');
        setError(null);
      });
      return () => {
        isMounted = false;
      };
    }

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setStatus('loading');
      setError(null);
    });

    void getMyPermissions(resource, resourceId)
      .then((nextPermissions) => {
        if (!isMounted) {
          return;
        }

        permissionCache.set(key, nextPermissions);
        setPermissions(nextPermissions);
        setStatus('success');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPermissions([]);
        setStatus('error');
        setError('Unable to load permissions.');
      });

    return () => {
      isMounted = false;
    };
  }, [key, resource, resourceId, shouldFetch]);

  const visiblePermissions = useMemo(
    () => (shouldFetch ? permissions : []),
    [permissions, shouldFetch],
  );
  const visibleStatus = shouldFetch ? status : 'idle';
  const permissionSet = useMemo(() => new Set(visiblePermissions), [visiblePermissions]);

  const can = useCallback(
    (permission: PermissionName) => permissionSet.has('admin') || permissionSet.has(permission),
    [permissionSet],
  );

  const canAny = useCallback(
    (requiredPermissions: PermissionName[]) =>
      permissionSet.has('admin') ||
      requiredPermissions.some((permission) => permissionSet.has(permission)),
    [permissionSet],
  );

  const canAll = useCallback(
    (requiredPermissions: PermissionName[]) =>
      permissionSet.has('admin') ||
      requiredPermissions.every((permission) => permissionSet.has(permission)),
    [permissionSet],
  );

  return {
    can,
    canAll,
    canAny,
    error,
    isError: visibleStatus === 'error',
    isIdle: visibleStatus === 'idle',
    isLoading: visibleStatus === 'loading',
    isSuccess: visibleStatus === 'success',
    permissions: visiblePermissions,
    status: visibleStatus,
  };
}
