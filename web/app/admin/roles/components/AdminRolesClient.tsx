'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  createAdminRole,
  deleteAdminRole,
  getAdminPermissions,
  getAdminRolePermissions,
  getAdminRoles,
  replaceAdminRolePermissions,
  updateAdminRole,
  type AdminPermissionResponse,
  type AdminRoleResponse,
} from '../../admin-api';
import { PageHeader } from '../../components/PageHeader';
import { RolesTable } from './RolesTable';
import { getPermissionId, sortRolesByApiFields, type RoleFormPayload } from './role-utils';

// Codex #admin-ui start
export default function AdminRolesClient() {
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionResponse[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, AdminPermissionResponse[]>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [defaultFilter, setDefaultFilter] = useState('all');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    setSelectedRoleIds([]);
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

  const handleReplaceRolePermissions = async (role: AdminRoleResponse, permissionIds: number[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await replaceAdminRolePermissions(role.id, permissionIds);
      setRolePermissions((currentRolePermissions) => ({
        ...currentRolePermissions,
        [role.id]: permissions.filter((item) => permissionIds.includes(getPermissionId(item))),
      }));
      setMessage('Role permissions updated successfully.');
    } catch {
      setError('Unable to update role permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRoleDefault = async (role: AdminRoleResponse, isDefault: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedRole = await updateAdminRole(role.id, { isDefault });
      setRoles((currentRoles) =>
        currentRoles.map((currentRole) =>
          currentRole.id === updatedRole.id ? updatedRole : currentRole,
        ),
      );
      setMessage('Role default status updated successfully.');
    } catch {
      setError('Unable to update role default status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoles = async (roleIds: number[]) => {
    if (!roleIds.length) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await Promise.all(roleIds.map((roleId) => deleteAdminRole(roleId)));
      await refreshRoles('Selected roles deleted successfully.');
    } catch {
      setError('Unable to delete selected roles. One or more roles may still be assigned.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleRoles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedRoles.filter((role) => {
        const matchesScope = scopeFilter === 'all' || role.scope === scopeFilter;
        const matchesDefault =
          defaultFilter === 'all' ||
          (defaultFilter === 'default' && role.isDefault) ||
          (defaultFilter === 'custom' && !role.isDefault);

        return matchesScope && matchesDefault;
      });
    }

    return sortedRoles.filter((role) => {
      const matchesSearch = [role.name, role.code, role.scope === 'SYS' ? 'System' : 'Project']
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesScope = scopeFilter === 'all' || role.scope === scopeFilter;
      const matchesDefault =
        defaultFilter === 'all' ||
        (defaultFilter === 'default' && role.isDefault) ||
        (defaultFilter === 'custom' && !role.isDefault);

      return matchesSearch && matchesScope && matchesDefault;
    });
  }, [defaultFilter, scopeFilter, searchQuery, sortedRoles]);

  const totalPages = Math.max(1, Math.ceil(visibleRoles.length / limit));
  const safePage = Math.min(page, totalPages);
  const paginatedRoles = visibleRoles.slice((safePage - 1) * limit, safePage * limit);

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearchQuery(value);
  };

  const handleLimitChange = (nextLimit: number) => {
    setPage(1);
    setLimit(nextLimit);
  };

  const handleScopeFilterChange = (value: string) => {
    setPage(1);
    setScopeFilter(value);
  };

  const handleDefaultFilterChange = (value: string) => {
    setPage(1);
    setDefaultFilter(value);
  };

  return (
    <>
      <PageHeader
        title="Roles"
        description="Manage role records and permission assignments from the backend role workflow."
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

      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8f9aa8]" />
          <Input
            className="h-10 border-[#4A5260] bg-[#393E46] pl-9 text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search roles by name, code, or scope"
            value={searchQuery}
          />
        </div>
        <Select onValueChange={handleScopeFilterChange} value={scopeFilter}>
          <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="SYS">System</SelectItem>
            <SelectItem value="PRJ">Project</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={handleDefaultFilterChange} value={defaultFilter}>
          <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
            <SelectItem value="all">All Defaults</SelectItem>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <RolesTable
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        limit={limit}
        onCreateRole={handleCreateRole}
        onDeleteSelectedRoles={() => void handleDeleteRoles(selectedRoleIds)}
        onLimitChange={handleLimitChange}
        onPageChange={setPage}
        onReplaceRolePermissions={handleReplaceRolePermissions}
        onSelectedRoleIdsChange={setSelectedRoleIds}
        onToggleRoleDefault={(role, isDefault) => void handleToggleRoleDefault(role, isDefault)}
        page={safePage}
        permissions={permissions}
        rolePermissions={rolePermissions}
        roles={paginatedRoles}
        selectedRoleIds={selectedRoleIds}
        total={visibleRoles.length}
        totalPages={totalPages}
      />
    </>
  );
}
// Codex #admin-ui end
