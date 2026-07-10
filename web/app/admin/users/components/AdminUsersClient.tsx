'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  createAdminUser,
  forceResetAdminUserPassword,
  getAdminRoles,
  getAdminUserRoles,
  getAdminUsers,
  replaceAdminUserRoles,
  type AdminRoleResponse,
  type AdminUserResponse,
} from '../../admin-api';
import { PageHeader } from '../../components/PageHeader';
import { CreateStaffDialog } from './UserDialogs';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';

// Codex #admin-ui start
export default function AdminUsersClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAdminUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [usersResult, sysRoles] = await Promise.all([
        getAdminUsers({ limit: 100 }),
        getAdminRoles('SYS'),
      ]);

      const usersWithRoles = await Promise.all(
        usersResult.users.map(async (user) => ({
          ...user,
          roles: await getAdminUserRoles(user.id),
        })),
      );

      setUsers(usersWithRoles);
      setRoles(sysRoles);
    } catch {
      setError('Unable to load admin users.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAdminUsers();
    });
  }, [loadAdminUsers]);

  useEffect(() => {
    if (searchParams.get('create') !== 'staff') {
      return;
    }

    queueMicrotask(() => {
      setIsCreateStaffOpen(true);
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
        roleFilter === 'all' || user.roles?.some((role) => String(role.id) === roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, users]);

  const creatableRoles = useMemo(
    () =>
      roles.filter((role) => {
        const normalizedRole = `${role.code} ${role.name}`.toLowerCase();

        return (
          (normalizedRole.includes('admin') || normalizedRole.includes('staff')) &&
          !normalizedRole.includes('member')
        );
      }),
    [roles],
  );

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

  const refreshWithMessage = async (nextMessage: string) => {
    setMessage(nextMessage);
    await loadAdminUsers();
  };

  const handleCreateUser = async (payload: {
    displayName?: string;
    email: string;
    roleIds: number[];
  }) => {
    await runMutation('Unable to create staff user.', async () => {
      const createdUser = await createAdminUser(payload);
      await forceResetAdminUserPassword(createdUser.id);
      await refreshWithMessage('Staff user created. A temporary password was sent by email.');
    });
  };

  const handleReplaceRoles = async (userId: number, roleIds: number[]) => {
    await runMutation('Unable to update user roles.', async () => {
      await replaceAdminUserRoles(userId, roleIds);
      await refreshWithMessage('User roles updated successfully.');
    });
  };

  const handleForceResetPassword = async (user: AdminUserResponse) => {
    await runMutation('Unable to force reset password.', async () => {
      await forceResetAdminUserPassword(user.id);
      setMessage(`Temporary password was sent to ${user.email}.`);
    });
  };

  const runMutation = async (errorMessage: string, mutation: () => Promise<void>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await mutation();
    } catch {
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        action={
          <CreateStaffDialog
            isOpen={isCreateStaffOpen}
            isSubmitting={isSubmitting}
            onOpenChange={setIsCreateStaffOpen}
            onSubmit={handleCreateUser}
            roles={creatableRoles}
          />
        }
        description="Search, filter, and manage staff accounts with system roles."
        title="Users"
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

      <UserFilters
        roleFilter={roleFilter}
        roles={roles}
        searchQuery={searchQuery}
        setRoleFilter={handleRoleFilterChange}
        setSearchQuery={handleSearchChange}
      />

      <UsersTable
        handleForceResetPassword={handleForceResetPassword}
        handleReplaceRoles={handleReplaceRoles}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        limit={limit}
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
// Codex #admin-ui end
