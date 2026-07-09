import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { AdminPermissionResponse, AdminRoleResponse } from '../../admin-api';
import { getPermissionAction, getPermissionId, groupPermissionsByResource } from './role-utils';

export function RolesTable({
  isLoading,
  isSubmitting,
  onDeleteRole,
  onTogglePermission,
  permissions,
  rolePermissions,
  roles,
}: {
  isLoading: boolean;
  isSubmitting: boolean;
  onDeleteRole: (role: AdminRoleResponse) => void;
  onTogglePermission: (
    role: AdminRoleResponse,
    permission: AdminPermissionResponse,
    checked: boolean,
  ) => void;
  permissions: AdminPermissionResponse[];
  rolePermissions: Record<number, AdminPermissionResponse[]>;
  roles: AdminRoleResponse[];
}) {
  const permissionGroups = groupPermissionsByResource(permissions);
  const columnCount = permissionGroups.length + 5;

  return (
    <Card className="border-[#4A5260] bg-[#0c1219] shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg text-[#EEEEEE]">Role Permission Matrix</CardTitle>
          <p className="mt-1 text-sm text-[#aeb7c2]">
            Tick permissions directly on each role row. Permission groups stay in one table.
          </p>
        </div>
        <Badge className="bg-[#FFD369] text-[#222831]">{roles.length} roles</Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#1d242d]">
            <TableRow className="border-[#4b535f] hover:bg-[#1d242d]">
              <TableHead className="min-w-56 text-[#dce7f3]">Role</TableHead>
              <TableHead className="text-[#dce7f3]">Scope</TableHead>
              <TableHead className="min-w-36 text-[#dce7f3]">Code</TableHead>
              <TableHead className="text-[#dce7f3]">Default</TableHead>
              {permissionGroups.map((permissionGroup) => (
                <TableHead className="min-w-44 text-[#dce7f3]" key={permissionGroup.group}>
                  {permissionGroup.group}
                </TableHead>
              ))}
              <TableHead className="min-w-36 text-right text-[#dce7f3]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="h-24 text-center text-[#aeb7c2]" colSpan={columnCount}>
                  Loading roles...
                </TableCell>
              </TableRow>
            ) : roles.length ? (
              roles.map((role) => {
                const selectedPermissionIds = new Set(
                  (rolePermissions[role.id] ?? []).map((permission) => getPermissionId(permission)),
                );

                return (
                  <TableRow
                    className="border-[#4b535f] bg-[#0b1118] align-top hover:bg-[#202832]"
                    key={role.id}
                  >
                    <TableCell>
                      <div className="font-semibold text-[#EEEEEE]">{role.name}</div>
                      <div className="text-xs text-[#8f9aa8]">ID: {role.id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="border-[#4A5260] text-[#aeb7c2]" variant="outline">
                        {role.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-[#aeb7c2]">{role.code}</TableCell>
                    <TableCell>
                      {role.isDefault ? (
                        <Badge className="bg-[#FFD369] text-[#222831]">Default</Badge>
                      ) : (
                        <span className="text-[#8f9aa8]">No</span>
                      )}
                    </TableCell>
                    {permissionGroups.map((permissionGroup) => {
                      const scopePermissions = permissionGroup.permissions.filter(
                        (permission) => permission.scope === role.scope,
                      );

                      return (
                        <TableCell key={`${role.id}-${permissionGroup.group}`}>
                          {scopePermissions.length ? (
                            <div className="grid gap-2">
                              {scopePermissions.map((permission) => {
                                const permissionId = getPermissionId(permission);

                                return (
                                  <label
                                    className="flex items-center gap-2 text-xs font-medium text-[#dce7f3]"
                                    key={permission.id}
                                  >
                                    <Checkbox
                                      checked={selectedPermissionIds.has(permissionId)}
                                      className="data-checked:border-[#FFD369] data-checked:bg-[#FFD369] data-checked:text-[#222831]"
                                      disabled={isSubmitting}
                                      onCheckedChange={(checked) =>
                                        onTogglePermission(role, permission, Boolean(checked))
                                      }
                                    />
                                    <span>{getPermissionAction(permission.name)}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[#4A5260]">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          className="bg-red-600 text-white hover:bg-red-500"
                          disabled={isSubmitting}
                          onClick={() => onDeleteRole(role)}
                          size="sm"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-[#aeb7c2]" colSpan={columnCount}>
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
