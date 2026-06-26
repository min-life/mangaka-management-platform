'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PermissionResponseItem } from '@/services/permission.service';
import type { RoleResponse } from '@/services/role.service';

import { formatOptionalDate } from './member-ui';

type RolesPermissionsPanelProps = {
  filteredRoles: RoleResponse[];
  isLoadingRoles: boolean;
  isSavingRolePermissions: boolean;
  myProjectPermissions: string[];
  onCloseRole: () => void;
  onPermissionSearchChange: (value: string) => void;
  onSaveRolePermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
  onSelectRole: (roleId: number) => void;
  permissionSearchQuery: string;
  projectId: number;
  projectPermissions: PermissionResponseItem[];
  projectRoles: RoleResponse[];
  rolePermissionsById: Record<number, PermissionResponseItem[]>;
  rolesError: string | null;
  selectedRole: RoleResponse | null;
  selectedRoleId: number | null;
  selectedRolePermissions: PermissionResponseItem[];
};

type PermissionGroup = {
  key: string;
  label: string;
  permissions: PermissionResponseItem[];
};

const permissionGroupLabels: Record<string, string> = {
  application: 'Applications',
  board: 'Editor Boards',
  comment: 'Comments',
  file: 'Files',
  folder: 'Folders',
  frame: 'Frames',
  material: 'Materials',
  member: 'Members',
  owner: 'Ownership',
  read: 'General',
  task: 'Tasks',
  update: 'General',
};

function getPermissionGroupKey(permissionName: string) {
  const [, rawAction = 'general'] = permissionName.split(':');
  return rawAction.split('.')[0] ?? 'general';
}

function formatPermissionAction(permissionName: string) {
  const [, rawAction = permissionName] = permissionName.split(':');
  return rawAction
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function groupPermissions(permissions: PermissionResponseItem[]): PermissionGroup[] {
  const groups = permissions.reduce<Record<string, PermissionResponseItem[]>>((result, permission) => {
    const groupKey = getPermissionGroupKey(permission.name);

    return {
      ...result,
      [groupKey]: [...(result[groupKey] ?? []), permission],
    };
  }, {});

  return Object.entries(groups)
    .map(([key, groupPermissionsList]) => ({
      key,
      label:
        permissionGroupLabels[key] ??
        key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
      permissions: groupPermissionsList,
    }))
    .sort((firstGroup, secondGroup) => firstGroup.label.localeCompare(secondGroup.label));
}

export function RolesPermissionsPanel({
  filteredRoles,
  isLoadingRoles,
  isSavingRolePermissions,
  myProjectPermissions,
  onCloseRole,
  onPermissionSearchChange,
  onSaveRolePermissions,
  onSelectRole,
  permissionSearchQuery,
  projectId,
  projectPermissions,
  projectRoles,
  rolePermissionsById,
  rolesError,
  selectedRole,
  selectedRoleId,
  selectedRolePermissions,
}: RolesPermissionsPanelProps) {
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<string>>(new Set());
  const normalizedPermissionSearchQuery = permissionSearchQuery.trim().toLowerCase();
  const groupedPermissions = useMemo(() => {
    const filteredPermissions = normalizedPermissionSearchQuery
      ? projectPermissions.filter((permission) =>
          [permission.name, permission.description ?? '', formatPermissionAction(permission.name)].some(
            (value) => value.toLowerCase().includes(normalizedPermissionSearchQuery),
          ),
        )
      : projectPermissions;

    return groupPermissions(filteredPermissions);
  }, [normalizedPermissionSearchQuery, projectPermissions]);

  useEffect(() => {
    queueMicrotask(() => {
      setDraftPermissionIds(new Set(selectedRolePermissions.map((permission) => permission.id)));
    });
  }, [selectedRole?.id, selectedRolePermissions]);

  const togglePermission = (permissionId: string) => {
    setDraftPermissionIds((currentPermissionIds) => {
      const nextPermissionIds = new Set(currentPermissionIds);

      if (nextPermissionIds.has(permissionId)) {
        nextPermissionIds.delete(permissionId);
      } else {
        nextPermissionIds.add(permissionId);
      }

      return nextPermissionIds;
    });
  };

  const togglePermissionGroup = (permissions: PermissionResponseItem[]) => {
    setDraftPermissionIds((currentPermissionIds) => {
      const nextPermissionIds = new Set(currentPermissionIds);
      const isEveryPermissionSelected = permissions.every((permission) =>
        nextPermissionIds.has(permission.id),
      );

      permissions.forEach((permission) => {
        if (isEveryPermissionSelected) {
          nextPermissionIds.delete(permission.id);
        } else {
          nextPermissionIds.add(permission.id);
        }
      });

      return nextPermissionIds;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      return;
    }

    await onSaveRolePermissions(
      selectedRole.id,
      Array.from(draftPermissionIds).map((permissionId) => Number(permissionId)),
    );
  };

  return (
    <section className="mt-4 space-y-4">
      {rolesError ? (
        <p className="rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {rolesError}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Project Roles
          </p>
          <p className="mt-3 text-2xl font-black text-white">{projectRoles.length}</p>
        </article>
        <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Project Permissions
          </p>
          <p className="mt-3 text-2xl font-black text-white">{projectPermissions.length}</p>
        </article>
        <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Your Permissions
          </p>
          <p className="mt-3 text-2xl font-black text-white">{myProjectPermissions.length}</p>
        </article>
      </div>

      <div className="rounded-[5px] border border-[#39424f] bg-[#101820] p-4">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
          Your Project Access
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {myProjectPermissions.length ? (
            myProjectPermissions.map((permission) => (
              <Badge
                className="h-6 rounded-[3px] border border-[#4f6e73] bg-[#2a454a] px-3 text-[10px] font-black text-[#e9fbff]"
                key={permission}
                variant="outline"
              >
                {permission}
              </Badge>
            ))
          ) : (
            <p className="text-xs font-bold text-[#aeb7c2]">
              No project permissions returned for this account.
            </p>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-[5px] border border-[#39424f] bg-[#101820]">
        <Table>
          <TableHeader>
            <TableRow className="h-[40px] border-[#39424f] bg-[#222a34] hover:bg-[#222a34]">
              <TableHead className="w-[26%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Role
              </TableHead>
              <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Default
              </TableHead>
              <TableHead className="w-[190px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Permissions
              </TableHead>
              <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Updated
              </TableHead>
              <TableHead className="w-[120px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Actions *
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRoles ? (
              <TableRow className="h-[72px] border-[#303842] bg-[#101820]">
                <TableCell className="px-5 text-xs font-bold text-[#aeb7c2]" colSpan={5}>
                  Loading roles and permissions...
                </TableCell>
              </TableRow>
            ) : filteredRoles.length ? (
              filteredRoles.map((role) => {
                const rolePermissions = rolePermissionsById[role.id] ?? [];
                const isSelected = selectedRoleId === role.id;

                return (
                  <TableRow
                    className={`h-[76px] border-l-4 border-r-0 border-t-0 border-b-[#303842] bg-[#101820] hover:border-l-[#FFD369] hover:bg-[#17202b] ${
                      isSelected ? 'border-l-[#FFD369] bg-[#17202b]' : 'border-l-transparent'
                    }`}
                    key={role.id}
                  >
                    <TableCell className="px-5">
                      <div>
                        <p className="text-sm font-black leading-5 text-white">{role.name}</p>
                        <p className="mt-1 text-[11px] font-bold text-[#aeb7c2]">
                          {role.code} - {role.scope}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`h-6 rounded-[3px] border px-3 text-[10px] font-black ${
                          role.isDefault
                            ? 'border-[#315846] bg-[#14291f] text-[#9df2c7]'
                            : 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]'
                        }`}
                        variant="outline"
                      >
                        {role.isDefault ? 'Default' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-black text-white">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-[#FFD369]" />
                        <span>{rolePermissions.length} permissions</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-black text-white">
                      {formatOptionalDate(role.updatedAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        className={`h-7 rounded-[4px] border-[#4b535f] px-3 text-[10px] font-black hover:bg-[#303842] ${
                          isSelected
                            ? 'bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]'
                            : 'bg-[#101820] text-white'
                        }`}
                        onClick={() => onSelectRole(role.id)}
                        variant="outline"
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="h-[72px] border-[#303842] bg-[#101820]">
                <TableCell className="px-5 text-xs font-bold text-[#aeb7c2]" colSpan={5}>
                  No project roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <footer className="flex h-[54px] items-center justify-between border-t border-[#39424f] bg-[#151c25] px-5">
          <p className="text-[11px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
            GET /roles?scope=PRJ - GET /permissions?scope=PRJ - GET
            /permissions/me/projects/{projectId}
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
            Role mutation not wired *
          </p>
        </footer>
      </section>

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            onCloseRole();
          }
        }}
        open={Boolean(selectedRole)}
      >
        <SheetContent
          className="w-[520px] max-w-[92vw] gap-0 border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[520px]"
          showCloseButton={false}
          side="right"
        >
          {selectedRole ? (
            <>
              <SheetHeader className="border-b border-[#303842] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SheetTitle className="text-xl font-black text-white">
                      {selectedRole.name}
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-xs font-bold text-[#aeb7c2]">
                      {selectedRole.code} - {selectedRole.scope}
                    </SheetDescription>
                  </div>
                  <Button
                    className="h-8 shrink-0 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
                    disabled
                    type="button"
                    variant="outline"
                  >
                    {draftPermissionIds.size} / {projectPermissions.length}
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
                <p className="mb-3 text-xs font-bold text-[#8b94a1]">
                  Permissions are grouped by module from GET /permissions?scope=PRJ.
                </p>

                <div className="flex h-10 items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#151c25] px-4 text-[#8b94a1]">
                  <Search className="size-4 text-[#dce7f3]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
                    onChange={(event) => onPermissionSearchChange(event.target.value)}
                    placeholder="Search assigned permissions..."
                    value={permissionSearchQuery}
                  />
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
                  {groupedPermissions.length ? (
                    groupedPermissions.map((group) => {
                      const selectedGroupPermissionCount = group.permissions.filter((permission) =>
                        draftPermissionIds.has(permission.id),
                      ).length;
                      const isGroupSelected =
                        selectedGroupPermissionCount === group.permissions.length &&
                        group.permissions.length > 0;

                      return (
                        <section
                          className="overflow-hidden rounded-[4px] border border-[#303842] bg-[#101820]"
                          key={group.key}
                        >
                          <button
                            className="flex h-11 w-full items-center justify-between bg-[#151c25] px-4 text-left"
                            onClick={() => togglePermissionGroup(group.permissions)}
                            type="button"
                          >
                            <span className="text-xs font-black uppercase tracking-[0.08em] text-white">
                              {group.label}
                            </span>
                            <span className="text-[11px] font-black text-[#FFD369]">
                              {selectedGroupPermissionCount}/{group.permissions.length}
                            </span>
                          </button>

                          <div>
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-[#303842] px-4 py-2">
                              <input
                                checked={isGroupSelected}
                                className="size-4 accent-[#FFD369]"
                                onChange={() => togglePermissionGroup(group.permissions)}
                                type="checkbox"
                              />
                              <span className="text-xs font-black text-[#dce7f3]">
                                Select all {group.label} permissions
                              </span>
                            </label>

                            {group.permissions.map((permission) => (
                              <label
                                className="flex min-h-14 cursor-pointer items-start gap-3 border-b border-[#303842] px-4 py-3 last:border-b-0"
                                key={`${selectedRole.id}-${permission.id}`}
                              >
                                <input
                                  checked={draftPermissionIds.has(permission.id)}
                                  className="mt-0.5 size-4 accent-[#FFD369]"
                                  onChange={() => togglePermission(permission.id)}
                                  type="checkbox"
                                />
                                <span className="min-w-0">
                                  <span className="block text-xs font-black text-white">
                                    {formatPermissionAction(permission.name)}
                                  </span>
                                  <span className="mt-1 block text-[11px] font-bold text-[#8b94a1]">
                                    {permission.name}
                                  </span>
                                  {permission.description ? (
                                    <span className="mt-1 block text-[11px] font-bold text-[#8b94a1]">
                                      {permission.description}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            ))}
                          </div>
                        </section>
                      );
                    })
                  ) : (
                    <p className="rounded-[4px] border border-[#303842] bg-[#101820] px-4 py-5 text-xs font-bold text-[#aeb7c2]">
                      No permissions found.
                    </p>
                  )}
                </div>
              </div>

              <SheetFooter className="flex-row items-center justify-between border-t border-[#303842] bg-[#151c25] px-5 py-4">
                <p className="text-xs font-black text-[#aeb7c2]">
                  {draftPermissionIds.size} permissions selected
                </p>
                <div className="flex items-center gap-3">
                  <SheetClose asChild>
                    <Button
                      className="h-8 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button
                    className="h-8 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
                    disabled={isSavingRolePermissions}
                    onClick={() => void handleSavePermissions()}
                    type="button"
                  >
                    {isSavingRolePermissions ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
