'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
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
  updateAdminRole,
  type AdminRoleResponse,
} from '../../admin-api';
import { AdminLoadingOverlay } from '../../components/AdminLoadingOverlay';
import { PageHeader } from '../../components/PageHeader';
import { useAdminStore } from '../../store/admin-store';
import { getApiErrorMessage } from '../../utils/api-error';
import { RolesTable } from './RolesTable';
import { getPermissionId, sortRolesByApiFields, type RoleFormPayload } from './role-utils';

export default function AdminRolesClient() {
  const roles = useAdminStore((state) => state.allRoles);
  const permissions = useAdminStore((state) => state.permissions);
  const rolePermissions = useAdminStore((state) => state.rolePermissions);
  const allRolesLoaded = useAdminStore((state) => state.allRolesLoaded);
  const permissionsLoaded = useAdminStore((state) => state.permissionsLoaded);
  const isRolesLoading = useAdminStore((state) => state.isRolesLoading);
  const rolesError = useAdminStore((state) => state.rolesError);
  const loadRolesPageData = useAdminStore((state) => state.loadRolesPageData);
  const removeRolesFromStore = useAdminStore((state) => state.removeRoles);
  const setRolePermissionsForRole = useAdminStore((state) => state.setRolePermissionsForRole);
  const updateRoleDefaultInStore = useAdminStore((state) => state.updateRoleDefault);
  const upsertRole = useAdminStore((state) => state.upsertRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [defaultFilter, setDefaultFilter] = useState('all');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isRolesLoading || !allRolesLoaded || !permissionsLoaded;

  const sortedRoles = useMemo(() => sortRolesByApiFields(roles), [roles]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRolesPageData();
    });
  }, [loadRolesPageData]);

  useEffect(() => {
    if (rolesError) {
      toast.error(rolesError);
    }
  }, [rolesError]);

  const handleCreateRole = async (payload: RoleFormPayload) => {
    setIsSubmitting(true);

    try {
      const role = await createAdminRole(payload);
      upsertRole(role);
      setRolePermissionsForRole(
        role.id,
        role.permissions ??
          permissions.filter((permission) =>
            payload.permissionIds?.includes(getPermissionId(permission)),
          ),
      );
      toast.success('Role created successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create role.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplaceRolePermissions = async (role: AdminRoleResponse, permissionIds: number[]) => {
    setIsSubmitting(true);

    try {
      const updatedRole = await updateAdminRole(role.id, { permissionIds });
      upsertRole(updatedRole);
      setRolePermissionsForRole(
        role.id,
        updatedRole.permissions ??
          permissions.filter((item) => permissionIds.includes(getPermissionId(item))),
      );
      toast.success('Role permissions updated successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update role permissions.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRoleDefault = async (role: AdminRoleResponse, isDefault: boolean) => {
    setIsSubmitting(true);

    try {
      const updatedRole = await updateAdminRole(role.id, { isDefault });
      updateRoleDefaultInStore(updatedRole);
      toast.success('Role default status updated successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update role default status.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoles = async (roleIds: number[]) => {
    if (!roleIds.length) {
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.all(roleIds.map((roleId) => deleteAdminRole(roleId)));
      removeRolesFromStore(roleIds);
      setSelectedRoleIds([]);
      toast.success('Selected roles deleted successfully.');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to delete selected roles. One or more roles may still be assigned.',
        ),
      );
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
      <AdminLoadingOverlay isVisible={isSubmitting} />
      <PageHeader title="Roles" description="Manage role records and permission." />

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
          <SelectContent
            align="start"
            className="w-[var(--radix-select-trigger-width)] min-w-0 border-[#4A5260] bg-[#393E46] text-[#EEEEEE]"
            position="popper"
            side="bottom"
            sideOffset={4}
          >
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="SYS">System</SelectItem>
            <SelectItem value="PRJ">Project</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={handleDefaultFilterChange} value={defaultFilter}>
          <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent
            align="start"
            className="w-[var(--radix-select-trigger-width)] min-w-0 border-[#4A5260] bg-[#393E46] text-[#EEEEEE]"
            position="popper"
            side="bottom"
            sideOffset={4}
          >
            <SelectItem value="all">All Defaults</SelectItem>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <RolesTable
        allRoles={sortedRoles}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        limit={limit}
        onCreateRole={handleCreateRole}
        onDeleteSelectedRoles={() => void handleDeleteRoles(selectedRoleIds)}
        onLimitChange={handleLimitChange}
        onPageChange={setPage}
        onReplaceRolePermissions={handleReplaceRolePermissions}
        onSelectedRoleIdsChange={setSelectedRoleIds}
        onToggleRoleDefault={handleToggleRoleDefault}
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
