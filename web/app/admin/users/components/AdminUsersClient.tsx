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
  updateAdminUser,
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
  const [statusFilter, setStatusFilter] = useState('all');
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
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'disabled' && !user.isActive);
      const matchesRole =
        roleFilter === 'all' || user.roles?.some((role) => String(role.id) === roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [roleFilter, searchQuery, statusFilter, users]);

  const refreshWithMessage = async (nextMessage: string) => {
    setMessage(nextMessage);
    await loadAdminUsers();
  };

  const handleCreateUser = async (payload: {
    displayName?: string;
    email: string;
    password?: string;
    roleIds: number[];
  }) => {
    await runMutation('Unable to create staff user.', async () => {
      await createAdminUser(payload);
      await refreshWithMessage('Staff user created successfully.');
    });
  };

  const handleUpdateUser = async (
    userId: number,
    payload: {
      displayName?: string;
      email?: string;
      isActive?: boolean;
    },
  ) => {
    await runMutation('Unable to update staff user.', async () => {
      await updateAdminUser(userId, payload);
      await refreshWithMessage('Staff user updated successfully.');
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
      const result = await forceResetAdminUserPassword(user.id);
      setMessage(`Temporary password for ${user.email}: ${result.newPassword}`);
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
            roles={roles}
          />
        }
        description="Search, filter, and manage staff accounts with system roles and account status."
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
        setRoleFilter={setRoleFilter}
        setSearchQuery={setSearchQuery}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
      />

      <UsersTable
        handleForceResetPassword={handleForceResetPassword}
        handleReplaceRoles={handleReplaceRoles}
        handleUpdateUser={handleUpdateUser}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        roles={roles}
        users={visibleUsers}
      />
    </>
  );
}
// Codex #admin-ui end
