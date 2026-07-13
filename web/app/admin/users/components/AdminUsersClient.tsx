'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { toast } from '@/lib/toast';

import {
  createAdminUser,
  forceResetAdminUserPassword,
  replaceAdminUserRoles,
  type AdminUserResponse,
} from '../../admin-api';
import { AdminLoadingOverlay } from '../../components/AdminLoadingOverlay';
import { PageHeader } from '../../components/PageHeader';
import { useAdminStore } from '../../store/admin-store';
import { getApiErrorMessage } from '../../utils/api-error';
import { CreateUserDialog } from './UserDialogs';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';

export default function AdminUsersClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const users = useAdminStore((state) => state.users);
  const roles = useAdminStore((state) => state.sysRoles);
  const userRolesById = useAdminStore((state) => state.userRolesById);
  const usersLoaded = useAdminStore((state) => state.usersLoaded);
  const isUsersLoading = useAdminStore((state) => state.isUsersLoading);
  const usersError = useAdminStore((state) => state.usersError);
  const loadSysRoles = useAdminStore((state) => state.loadSysRoles);
  const loadUsersPageData = useAdminStore((state) => state.loadUsersPageData);
  const loadUserRolesFromStore = useAdminStore((state) => state.loadUserRoles);
  const setUserRolesForUser = useAdminStore((state) => state.setUserRolesForUser);
  const upsertUser = useAdminStore((state) => state.upsertUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const isLoading = isUsersLoading || !usersLoaded;

  useEffect(() => {
    queueMicrotask(() => {
      void loadUsersPageData();
    });
  }, [loadUsersPageData]);

  useEffect(() => {
    if (usersError) {
      toast.error(usersError);
    }
  }, [usersError]);

  useEffect(() => {
    const createMode = searchParams.get('create');
    if (createMode !== 'user' && createMode !== 'staff') {
      return;
    }

    queueMicrotask(() => {
      setIsCreateUserOpen(true);
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedQuery ||
        [user.displayName, user.email]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesRole =
        roleFilter === 'all' ||
        userRolesById[user.id]?.some((role) => String(role.id) === roleFilter) ||
        user.roles?.some((role) => String(role.id) === roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, userRolesById, users]);

  const filterRoles = useMemo(() => {
    const rolesById = new Map<number, (typeof roles)[number]>();

    users.forEach((user) => {
      user.roles?.forEach((role) => {
        rolesById.set(role.id, role);
      });
    });
    roles.forEach((role) => {
      rolesById.set(role.id, role);
    });

    return Array.from(rolesById.values()).sort((firstRole, secondRole) =>
      firstRole.name.localeCompare(secondRole.name),
    );
  }, [roles, users]);

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / limit));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = visibleUsers.slice((safePage - 1) * limit, safePage * limit);

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearchQuery(value);
  };

  const handleRoleFilterChange = (value: string) => {
    setPage(1);
    setRoleFilter(value);
  };

  const handleLimitChange = (nextLimit: number) => {
    setPage(1);
    setLimit(nextLimit);
  };

  const getCachedUserRoles = useCallback(
    (userId: number) => userRolesById[userId],
    [userRolesById],
  );

  const loadUserRoles = useCallback(
    async (userId: number) => {
      try {
        return await loadUserRolesFromStore(userId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Unable to load current roles.'));
        throw error;
      }
    },
    [loadUserRolesFromStore],
  );

  const loadAvailableRoles = useCallback(async () => {
    try {
      return await loadSysRoles();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load roles.'));
      throw error;
    }
  }, [loadSysRoles]);

  const handleCreateUser = async (payload: {
    displayName?: string;
    email: string;
    roleIds: number[];
  }) => {
    await runMutation('Unable to create user.', async () => {
      const createdUser = await createAdminUser(payload);
      const nextRoles = roles.filter((role) => payload.roleIds.includes(Number(role.id)));
      upsertUser({ ...createdUser, roles: nextRoles });
      setUserRolesForUser(createdUser.id, nextRoles);
      toast.success(`User created. Password was sent to ${payload.email}.`);
    });
  };

  const handleReplaceRoles = async (userId: number, roleIds: number[]) => {
    await runMutation('Unable to update user roles.', async () => {
      await replaceAdminUserRoles(userId, roleIds);
      const nextRoles = roles.filter((role) => roleIds.includes(Number(role.id)));
      setUserRolesForUser(userId, nextRoles);
      toast.success('User roles updated successfully.');
    });
  };

  const handleForceResetPassword = async (user: AdminUserResponse) => {
    await runMutation('Unable to force reset password.', async () => {
      await forceResetAdminUserPassword(user.id);
      toast.success(`Temporary password was sent to ${user.email}.`);
    });
  };

  const runMutation = async (errorMessage: string, mutation: () => Promise<void>) => {
    setIsSubmitting(true);

    try {
      await mutation();
    } catch (error) {
      toast.error(getApiErrorMessage(error, errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminLoadingOverlay isVisible={isSubmitting} />
      <PageHeader
        action={
          <CreateUserDialog
            isOpen={isCreateUserOpen}
            isSubmitting={isSubmitting}
            onLoadRoles={loadAvailableRoles}
            onOpenChange={setIsCreateUserOpen}
            onSubmit={handleCreateUser}
            roles={roles}
          />
        }
        description="Search, filter, and manage user accounts with system roles."
        title="Users"
      />

      <UserFilters
        roleFilter={roleFilter}
        roles={filterRoles}
        searchQuery={searchQuery}
        setRoleFilter={handleRoleFilterChange}
        setSearchQuery={handleSearchChange}
      />

      <UsersTable
        handleForceResetPassword={handleForceResetPassword}
        handleReplaceRoles={handleReplaceRoles}
        getCachedUserRoles={getCachedUserRoles}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        limit={limit}
        loadAvailableRoles={loadAvailableRoles}
        loadUserRoles={loadUserRoles}
        onLimitChange={handleLimitChange}
        onPageChange={setPage}
        page={safePage}
        roles={roles}
        total={visibleUsers.length}
        totalPages={totalPages}
        users={paginatedUsers}
      />
    </>
  );
}
