'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  createAdminRole,
  deleteAdminRole,
  getAdminPermissions,
  getAdminRolePermissions,
  getAdminRoles,
  replaceAdminRolePermissions,
  type AdminPermissionResponse,
  type AdminRoleResponse,
} from '../../admin-api';
import { PageHeader } from '../../components/PageHeader';
import { RoleFormDialog } from './RoleFormDialog';
import { RolesTable } from './RolesTable';
import { getPermissionId, sortRolesByApiFields, type RoleFormPayload } from './role-utils';

// Codex #admin-ui start
export default function AdminRolesClient() {
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionResponse[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, AdminPermissionResponse[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedRoles = useMemo(() => sortRolesByApiFields(roles), [roles]);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextRoles, nextPermissions] = await Promise.all([
        getAdminRoles(),
        getAdminPermissions(),
      ]);
      const nextRolePermissions = await Promise.all(
        nextRoles.map(async (role) => ({
          permissions: await getAdminRolePermissions(role.id),
          roleId: role.id,
        })),
      );

      setRoles(nextRoles);
      setPermissions(nextPermissions);
      setRolePermissions(
        nextRolePermissions.reduce<Record<number, AdminPermissionResponse[]>>(
          (currentPermissions, item) => ({
            ...currentPermissions,
            [item.roleId]: item.permissions,
          }),
          {},
        ),
      );
    } catch {
      setError('Unable to load roles.');
      setRoles([]);
      setPermissions([]);
      setRolePermissions({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRoles();
    });
  }, [loadRoles]);

  const refreshRoles = async (nextMessage: string) => {
    setMessage(nextMessage);
    await loadRoles();
  };

  const handleCreateRole = async (payload: RoleFormPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const role = await createAdminRole(payload);
      if (payload.permissionIds?.length) {
        await replaceAdminRolePermissions(role.id, payload.permissionIds);
      }
      await refreshRoles('Role created successfully.');
    } catch {
      setError('Unable to create role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermission = async (
    role: AdminRoleResponse,
    permission: AdminPermissionResponse,
    checked: boolean,
  ) => {
    const currentPermissions = rolePermissions[role.id] ?? [];
    const currentPermissionIds = currentPermissions.map((item) => getPermissionId(item));
    const permissionId = getPermissionId(permission);
    const nextPermissionIds = checked
      ? Array.from(new Set([...currentPermissionIds, permissionId]))
      : currentPermissionIds.filter((currentPermissionId) => currentPermissionId !== permissionId);

    setIsSubmitting(true);
    setError(null);

    try {
      await replaceAdminRolePermissions(role.id, nextPermissionIds);
      setRolePermissions((currentRolePermissions) => ({
        ...currentRolePermissions,
        [role.id]: permissions.filter((item) => nextPermissionIds.includes(getPermissionId(item))),
      }));
      setMessage('Role permissions updated successfully.');
    } catch {
      setError('Unable to update role permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: AdminRoleResponse) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteAdminRole(role.id);
      await refreshRoles('Role deleted successfully.');
    } catch {
      setError('Unable to delete role. This role may still be assigned to users or projects.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Roles"
        description="Manage role records and permission assignments from the backend role workflow."
        action={
          <RoleFormDialog
            availablePermissions={permissions}
            defaultScope="SYS"
            isSubmitting={isSubmitting}
            onSubmit={handleCreateRole}
            trigger={
              <Button className="bg-[#FFD369] text-[#222831] hover:bg-white">
                <Plus className="size-4" />
                Create Role
              </Button>
            }
          />
        }
      />

      {message ? (
        <p className="rounded-lg border border-[#FFD369]/40 bg-[#FFD369]/15 px-4 py-3 text-sm font-medium text-[#FFD369]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </p>
      ) : null}

      <RolesTable
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onDeleteRole={(role) => void handleDeleteRole(role)}
        onTogglePermission={(role, permission, checked) =>
          void handleTogglePermission(role, permission, checked)
        }
        permissions={permissions}
        rolePermissions={rolePermissions}
        roles={sortedRoles}
      />
    </>
  );
}
// Codex #admin-ui end
