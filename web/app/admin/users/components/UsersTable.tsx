'use client';

import { KeyRound, UserCheck, UserX } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { AdminRoleResponse, AdminUserResponse } from '../../admin-api';
import { StatusBadge } from '../../components/StatusBadge';
import { ManageRolesDialog } from './UserDialogs';
import { getInitials, getUserRoleNames } from './user-utils';

type UsersTableProps = {
  handleForceResetPassword: (user: AdminUserResponse) => Promise<void>;
  handleReplaceRoles: (userId: number, roleIds: number[]) => Promise<void>;
  handleUpdateUser: (
    userId: number,
    payload: {
      displayName?: string;
      email?: string;
      isActive?: boolean;
    },
  ) => Promise<void>;
  isLoading: boolean;
  isSubmitting: boolean;
  roles: AdminRoleResponse[];
  users: AdminUserResponse[];
};

export function UsersTable({
  handleForceResetPassword,
  handleReplaceRoles,
  handleUpdateUser,
  isLoading,
  isSubmitting,
  roles,
  users,
}: UsersTableProps) {
  return (
    <Card className="border-[#4A5260] bg-[#0c1219] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#EEEEEE]">Staff Table</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-[#1d242d]">
            <TableRow className="border-[#4b535f] hover:bg-[#1d242d]">
              <TableHead className="text-[#dce7f3]">Avatar</TableHead>
              <TableHead className="text-[#dce7f3]">Name</TableHead>
              <TableHead className="text-[#dce7f3]">Email</TableHead>
              <TableHead className="text-[#dce7f3]">Roles</TableHead>
              <TableHead className="text-[#dce7f3]">Status</TableHead>
              <TableHead className="text-[#dce7f3]">Created Date</TableHead>
              <TableHead className="text-right text-[#dce7f3]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="h-24 text-center text-[#aeb7c2]" colSpan={7}>
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center text-[#aeb7c2]" colSpan={7}>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  className="border-[#4b535f] bg-[#0b1118] hover:bg-[#202832]"
                  key={user.id}
                >
                  <TableCell>
                    <Avatar>
                      <AvatarFallback className="bg-[#393E46] text-[#EEEEEE]">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-[#EEEEEE]">
                    {user.displayName || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-[#aeb7c2]">{user.email}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-[#aeb7c2]">
                    {getUserRoleNames(user)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.isActive ? 'Active' : 'Disabled'} />
                  </TableCell>
                  <TableCell className="text-[#aeb7c2]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <div className="inline-flex flex-wrap justify-end gap-1 rounded-lg border border-[#4A5260] bg-[#101820] p-1">
                        <ManageRolesDialog
                          currentRoles={user.roles ?? []}
                          isSubmitting={isSubmitting}
                          onSubmit={(roleIds) => handleReplaceRoles(user.id, roleIds)}
                          roles={roles}
                          user={user}
                        />
                        <Button
                          className="border-transparent bg-[#1d242d] text-[#dce7f3] hover:border-[#FFD369] hover:bg-[#303640]"
                          disabled={isSubmitting}
                          onClick={() => void handleForceResetPassword(user)}
                          size="sm"
                          variant="outline"
                        >
                          <KeyRound className="size-3.5" />
                          Reset
                        </Button>
                        <Button
                          className={
                            user.isActive
                              ? 'border-transparent bg-red-950/60 text-red-200 hover:bg-red-900'
                              : 'border-transparent bg-[#FFD369] text-[#222831] hover:bg-white'
                          }
                          disabled={isSubmitting}
                          onClick={() =>
                            void handleUpdateUser(user.id, { isActive: !user.isActive })
                          }
                          size="sm"
                          variant={user.isActive ? 'outline' : 'default'}
                        >
                          {user.isActive ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
