'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';

import { Pagination } from '@/app/(protected)/studio/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { AdminPermissionResponse, AdminRoleResponse, AdminRoleScope } from '../../admin-api';
import {
  getPermissionAction,
  getPermissionId,
  groupPermissionsByResource,
  SCOPE_OPTIONS,
  type RoleFormPayload,
} from './role-utils';

type RolesTableProps = {
  allRoles: AdminRoleResponse[];
  isLoading: boolean;
  isSubmitting: boolean;
  limit: number;
  onCreateRole: (payload: RoleFormPayload) => Promise<void>;
  onDeleteSelectedRoles: () => void;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
  onReplaceRolePermissions: (role: AdminRoleResponse, permissionIds: number[]) => Promise<void>;
  onSelectedRoleIdsChange: (roleIds: number[]) => void;
  onToggleRoleDefault: (role: AdminRoleResponse, isDefault: boolean) => Promise<void>;
  page: number;
  permissions: AdminPermissionResponse[];
  rolePermissions: Record<number, AdminPermissionResponse[]>;
  roles: AdminRoleResponse[];
  selectedRoleIds: number[];
  total: number;
  totalPages: number;
};

function getScopeLabel(scope: AdminRoleScope) {
  return scope === 'SYS' ? 'System' : 'Project';
}

function getPermissionDescription(permissions: AdminPermissionResponse[], fallback: string) {
  return (
    Array.from(
      new Set(
        permissions
          .map((permission) => permission.description?.trim())
          .filter((description): description is string => Boolean(description)),
      ),
    ).join(' • ') || fallback
  );
}

export function RolesTable({
  allRoles,
  isLoading,
  isSubmitting,
  limit,
  onCreateRole,
  onDeleteSelectedRoles,
  onLimitChange,
  onPageChange,
  onReplaceRolePermissions,
  onSelectedRoleIdsChange,
  onToggleRoleDefault,
  page,
  permissions,
  rolePermissions,
  roles,
  selectedRoleIds,
  total,
  totalPages,
}: RolesTableProps) {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleScope, setNewRoleScope] = useState<AdminRoleScope>('SYS');
  const [newRoleIsDefault, setNewRoleIsDefault] = useState(false);
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [draftRolePermissionIds, setDraftRolePermissionIds] = useState<Record<number, number[]>>(
    {},
  );
  const [draftRoleDefaults, setDraftRoleDefaults] = useState<Record<number, boolean>>({});
  const canCreateRole = Boolean(newRoleName.trim() && newRoleCode.trim());
  const permissionGroups = useMemo(() => groupPermissionsByResource(permissions), [permissions]);
  const permissionColumns = useMemo(
    () =>
      permissionGroups.map((permissionGroup) => ({
        ...permissionGroup,
        actions: Array.from(
          new Set(
            permissionGroup.permissions.map((permission) => getPermissionAction(permission.name)),
          ),
        ),
        description: getPermissionDescription(
          permissionGroup.permissions,
          `${permissionGroup.group} permissions`,
        ),
        isExpandable:
          Array.from(
            new Set(
              permissionGroup.permissions.map((permission) => getPermissionAction(permission.name)),
            ),
          ).length > 1,
      })),
    [permissionGroups],
  );
  const visibleRoleIds = roles.map((role) => role.id);
  const selectedVisibleRoleIds = visibleRoleIds.filter((roleId) =>
    selectedRoleIds.includes(roleId),
  );
  const allVisibleRolesSelected =
    visibleRoleIds.length > 0 && selectedVisibleRoleIds.length === visibleRoleIds.length;
  const permissionColumnCount = permissionColumns.reduce(
    (totalColumns, permissionGroup) =>
      totalColumns +
      1 +
      (permissionGroup.isExpandable && expandedGroups.includes(permissionGroup.group)
        ? permissionGroup.actions.length
        : 0),
    0,
  );
  const columnCount = permissionColumnCount + 5;
  const stickySelectClassName = 'sticky left-0 z-50 w-14 min-w-14 bg-[#111a24]';
  const stickyRoleClassName =
    'sticky left-14 z-50 w-[clamp(11rem,18vw,14rem)] min-w-[clamp(11rem,18vw,14rem)] max-w-[clamp(11rem,18vw,14rem)] bg-[#111a24]';
  const stickyScopeClassName =
    'sticky left-[calc(3.5rem_+_clamp(11rem,18vw,14rem))] z-50 w-[clamp(7rem,10vw,9rem)] min-w-[clamp(7rem,10vw,9rem)] max-w-[clamp(7rem,10vw,9rem)] bg-[#111a24]';
  const stickyCodeClassName =
    'sticky left-[calc(3.5rem_+_clamp(11rem,18vw,14rem)_+_clamp(7rem,10vw,9rem))] z-50 w-[clamp(8rem,12vw,11rem)] min-w-[clamp(8rem,12vw,11rem)] max-w-[clamp(8rem,12vw,11rem)] bg-[#111a24] shadow-[10px_0_14px_rgba(0,0,0,0.22)]';
  const permissionGroupClassName =
    'min-w-[clamp(5.5rem,8vw,7rem)] border-l border-[#FFD369]/35 bg-[#243246] text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#f5d77d]';
  const permissionActionClassName =
    'min-w-[clamp(4.75rem,7vw,6rem)] border-l border-[#FFD369]/10 bg-[#344151] text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3] shadow-[inset_0_3px_0_rgba(255,211,105,0.32)]';
  const permissionGroupCellClassName =
    'border-l border-[#FFD369]/25 bg-[#111d2b] align-middle text-center shadow-[inset_3px_0_0_rgba(255,211,105,0.22)]';
  const permissionActionCellClassName =
    'border-l border-[#2f4257] bg-[#1b2b3d] align-middle text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.04)]';
  const checkboxClassName =
    'hover:bg-transparent data-checked:border-[#FFD369] data-checked:bg-[#FFD369] data-checked:text-[#222831] data-checked:hover:bg-[#FFD369]';
  const changedCheckboxClassName =
    'border-[#7dd3fc] bg-[#0f2a3a] ring-2 ring-[#7dd3fc]/45 hover:bg-[#0f2a3a] data-checked:border-[#7dd3fc] data-checked:bg-[#7dd3fc] data-checked:text-[#07131f] data-checked:hover:bg-[#7dd3fc]';
  const unavailableTextClassName = 'text-xs font-black text-[#5f6875]';

  const toggleRoleSelection = (roleId: number, checked: boolean) => {
    onSelectedRoleIdsChange(
      checked
        ? Array.from(new Set([...selectedRoleIds, roleId]))
        : selectedRoleIds.filter((selectedRoleId) => selectedRoleId !== roleId),
    );
  };

  const toggleVisibleRoleSelection = (checked: boolean) => {
    onSelectedRoleIdsChange(
      checked
        ? Array.from(new Set([...selectedRoleIds, ...visibleRoleIds]))
        : selectedRoleIds.filter((roleId) => !visibleRoleIds.includes(roleId)),
    );
  };

  const handleCreateRole = async () => {
    if (!canCreateRole || isSubmitting) {
      return;
    }

    await onCreateRole({
      code: newRoleCode.trim(),
      isDefault: newRoleIsDefault,
      name: newRoleName.trim(),
      permissionIds: newRolePermissionIds,
      scope: newRoleScope,
    });
    setNewRoleName('');
    setNewRoleCode('');
    setNewRoleScope('SYS');
    setNewRoleIsDefault(false);
    setNewRolePermissionIds([]);
  };

  const handleCreateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    void handleCreateRole();
  };

  const handleNewRoleScopeChange = (value: string) => {
    setNewRoleScope(value as AdminRoleScope);
    setNewRolePermissionIds([]);
  };

  const toggleExpandedGroup = (key: string) => {
    setExpandedGroups((currentGroups) =>
      currentGroups.includes(key)
        ? currentGroups.filter((currentGroup) => currentGroup !== key)
        : [...currentGroups, key],
    );
  };

  const getPermissionByAction = (
    role: AdminRoleResponse,
    groupPermissions: AdminPermissionResponse[],
    action: string,
  ) =>
    groupPermissions.find(
      (permission) =>
        permission.scope === role.scope && getPermissionAction(permission.name) === action,
    );

  const getNewRolePermissionByAction = (
    groupPermissions: AdminPermissionResponse[],
    action: string,
  ) =>
    groupPermissions.find(
      (permission) =>
        permission.scope === newRoleScope && getPermissionAction(permission.name) === action,
    );

  const getCurrentRolePermissionIds = (roleId: number) =>
    (rolePermissions[roleId] ?? []).map((permission) => getPermissionId(permission));

  const getDraftRolePermissionIds = (role: AdminRoleResponse) =>
    draftRolePermissionIds[role.id] ?? getCurrentRolePermissionIds(role.id);

  const getDraftRoleDefault = (role: AdminRoleResponse) =>
    draftRoleDefaults[role.id] ?? role.isDefault;

  const hasDraftDefaultChanges = (role: AdminRoleResponse) =>
    draftRoleDefaults[role.id] !== undefined && draftRoleDefaults[role.id] !== role.isDefault;

  const hasDraftPermissionChanges = (role: AdminRoleResponse) => {
    const currentPermissionIds = [...getCurrentRolePermissionIds(role.id)].sort((a, b) => a - b);
    const draftPermissionIds = [...getDraftRolePermissionIds(role)].sort((a, b) => a - b);

    return (
      currentPermissionIds.length !== draftPermissionIds.length ||
      currentPermissionIds.some((permissionId, index) => permissionId !== draftPermissionIds[index])
    );
  };

  const hasDraftRoleChanges = (role: AdminRoleResponse) =>
    hasDraftPermissionChanges(role) || hasDraftDefaultChanges(role);

  const expandPermissionGroup = (group: string) => {
    setExpandedGroups((currentGroups) =>
      currentGroups.includes(group) ? currentGroups : [...currentGroups, group],
    );
  };

  const replaceNewRoleGroupPermissions = (
    group: string,
    groupPermissions: AdminPermissionResponse[],
    checked: boolean,
  ) => {
    expandPermissionGroup(group);

    const groupPermissionIds = groupPermissions
      .filter((permission) => permission.scope === newRoleScope)
      .map((permission) => getPermissionId(permission));

    setNewRolePermissionIds((currentPermissionIds) =>
      checked
        ? Array.from(new Set([...currentPermissionIds, ...groupPermissionIds]))
        : currentPermissionIds.filter((permissionId) => !groupPermissionIds.includes(permissionId)),
    );
  };

  const replaceNewRolePermission = (permission: AdminPermissionResponse, checked: boolean) => {
    const permissionId = getPermissionId(permission);

    setNewRolePermissionIds((currentPermissionIds) =>
      checked
        ? Array.from(new Set([...currentPermissionIds, permissionId]))
        : currentPermissionIds.filter(
            (currentPermissionId) => currentPermissionId !== permissionId,
          ),
    );
  };

  const replaceDraftGroupPermissions = (
    role: AdminRoleResponse,
    group: string,
    groupPermissions: AdminPermissionResponse[],
    checked: boolean,
  ) => {
    expandPermissionGroup(group);

    const selectedPermissionIds = getDraftRolePermissionIds(role);
    const groupPermissionIds = groupPermissions.map((permission) => getPermissionId(permission));
    const nextPermissionIds = checked
      ? Array.from(new Set([...selectedPermissionIds, ...groupPermissionIds]))
      : selectedPermissionIds.filter((permissionId) => !groupPermissionIds.includes(permissionId));

    setDraftRolePermissionIds((currentDrafts) => ({
      ...currentDrafts,
      [role.id]: nextPermissionIds,
    }));
  };

  const replaceDraftPermission = (
    role: AdminRoleResponse,
    permission: AdminPermissionResponse,
    checked: boolean,
  ) => {
    const selectedPermissionIds = getDraftRolePermissionIds(role);
    const permissionId = getPermissionId(permission);
    const nextPermissionIds = checked
      ? Array.from(new Set([...selectedPermissionIds, permissionId]))
      : selectedPermissionIds.filter(
          (selectedPermissionId) => selectedPermissionId !== permissionId,
        );

    setDraftRolePermissionIds((currentDrafts) => ({
      ...currentDrafts,
      [role.id]: nextPermissionIds,
    }));
  };

  const replaceDraftRoleDefault = (role: AdminRoleResponse, checked: boolean) => {
    setDraftRoleDefaults((currentDrafts) => {
      if (!checked) {
        return currentDrafts;
      }

      const nextDrafts = { ...currentDrafts };
      allRoles
        .filter((currentRole) => currentRole.scope === role.scope)
        .forEach((currentRole) => {
          nextDrafts[currentRole.id] = currentRole.id === role.id;
        });

      return nextDrafts;
    });
  };

  const handleUpdateRolePermissions = async (role: AdminRoleResponse) => {
    await onReplaceRolePermissions(role, getDraftRolePermissionIds(role));
    setDraftRolePermissionIds((currentDrafts) => {
      const remainingDrafts = { ...currentDrafts };
      delete remainingDrafts[role.id];

      return remainingDrafts;
    });
  };

  const handleUpdateRoleDefault = async (role: AdminRoleResponse) => {
    await onToggleRoleDefault(role, getDraftRoleDefault(role));
    setDraftRoleDefaults((currentDrafts) => {
      const remainingDrafts = { ...currentDrafts };
      delete remainingDrafts[role.id];

      return remainingDrafts;
    });
  };

  const pendingRoleChanges = allRoles.filter((role) => hasDraftRoleChanges(role));

  const handleUpdateDraftRoles = async () => {
    for (const role of pendingRoleChanges) {
      if (hasDraftDefaultChanges(role)) {
        await handleUpdateRoleDefault(role);
      }

      if (hasDraftPermissionChanges(role)) {
        await handleUpdateRolePermissions(role);
      }
    }
  };

  const resetDraftRoles = () => {
    setDraftRolePermissionIds({});
    setDraftRoleDefaults({});
  };

  const isPermissionDraftChanged = (role: AdminRoleResponse, permissionId: number) => {
    const currentPermissionIds = getCurrentRolePermissionIds(role.id);
    const draftPermissionIds = getDraftRolePermissionIds(role);

    return (
      currentPermissionIds.includes(permissionId) !== draftPermissionIds.includes(permissionId)
    );
  };

  const isPermissionGroupDraftChanged = (
    role: AdminRoleResponse,
    groupPermissions: AdminPermissionResponse[],
  ) =>
    groupPermissions.some((permission) =>
      isPermissionDraftChanged(role, getPermissionId(permission)),
    );

  const getRoleCheckboxClassName = (hasChanged: boolean) =>
    hasChanged ? changedCheckboxClassName : checkboxClassName;

  return (
    <TooltipProvider>
      <section className="overflow-hidden rounded-[5px] border border-[#39424f] bg-[#101820]">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#39424f] bg-[#0d151e] px-5 py-3">
          <div>
            <h2 className="text-sm font-black text-white">Role Permission Matrix</h2>
            <p className="mt-1 text-xs font-bold text-[#8b94a1]">
              Tick a resource to select all permissions, or open it to choose actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingRoleChanges.length ? (
              <>
                <Button
                  className="border-[#4A5260] bg-[#1d242d] text-[#dce7f3] hover:border-[#7dd3fc] hover:bg-[#243246]"
                  disabled={isSubmitting}
                  onClick={resetDraftRoles}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
                <Button
                  className="bg-[#FFD369] text-[#222831] hover:bg-white"
                  disabled={isSubmitting}
                  onClick={() => void handleUpdateDraftRoles()}
                  size="sm"
                >
                  <Check className="size-3.5" />
                  Update
                </Button>
              </>
            ) : null}
            {canCreateRole ? (
              <Button
                className="bg-[#FFD369] text-[#222831] hover:bg-white"
                disabled={isSubmitting}
                onClick={() => void handleCreateRole()}
                size="sm"
              >
                <Plus className="size-3.5" />
                Create
              </Button>
            ) : null}
            <Badge className="bg-[#FFD369] text-[#222831]">{total} roles</Badge>
            {selectedRoleIds.length ? (
              <Button
                className="bg-red-600 text-white hover:bg-red-500"
                disabled={isSubmitting}
                onClick={onDeleteSelectedRoles}
                size="sm"
              >
                <Trash2 className="size-3.5" />
                Delete {selectedRoleIds.length}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full min-w-full table-auto">
            <TableHeader>
              <TableRow className="h-[40px] border-[#39424f] bg-[#222a34] hover:bg-[#222a34]">
                <TableHead className={`${stickySelectClassName} px-5`}>
                  <Checkbox
                    checked={allVisibleRolesSelected}
                    className={checkboxClassName}
                    onCheckedChange={(checked) => toggleVisibleRoleSelection(Boolean(checked))}
                  />
                </TableHead>
                <TableHead
                  className={`${stickyRoleClassName} text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]`}
                >
                  Role
                </TableHead>
                <TableHead
                  className={`${stickyScopeClassName} text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]`}
                >
                  Scope
                </TableHead>
                <TableHead
                  className={`${stickyCodeClassName} text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]`}
                >
                  Code
                </TableHead>
                <TableHead className="min-w-28 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Default
                </TableHead>
                {permissionColumns.flatMap((permissionGroup) => {
                  const isExpanded =
                    permissionGroup.isExpandable && expandedGroups.includes(permissionGroup.group);

                  return [
                    <TableHead
                      className={`${permissionGroupClassName} ${
                        permissionGroup.isExpandable ? 'cursor-pointer select-none' : ''
                      }`}
                      key={permissionGroup.group}
                      onClick={() =>
                        permissionGroup.isExpandable
                          ? toggleExpandedGroup(permissionGroup.group)
                          : undefined
                      }
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {permissionGroup.isExpandable ? (
                            <button
                              className="flex w-full items-center justify-center gap-1 text-[#dce7f3] hover:text-[#FFD369]"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleExpandedGroup(permissionGroup.group);
                              }}
                              type="button"
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                              {permissionGroup.group}
                            </button>
                          ) : (
                            <span className="inline-flex w-full justify-center">
                              {permissionGroup.group}
                            </span>
                          )}
                        </TooltipTrigger>
                        <TooltipContent
                          className="border border-[#39424f] bg-[#0d151e] text-[#dce7f3]"
                          side="top"
                          sideOffset={8}
                        >
                          {permissionGroup.description}
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>,
                    ...(isExpanded
                      ? permissionGroup.actions.map((action) => (
                          <TableHead
                            className={permissionActionClassName}
                            key={`${permissionGroup.group}-${action}`}
                          >
                            {action}
                          </TableHead>
                        ))
                      : []),
                  ];
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="h-[56px] border-[#303842] bg-[#0f1822] align-middle hover:bg-[#0f1822]">
                <TableCell className={`${stickySelectClassName} px-5 align-middle`}>
                  <Plus className="size-4 text-[#FFD369]" />
                </TableCell>
                <TableCell className={`${stickyRoleClassName} align-middle`}>
                  <div className="flex w-full items-center gap-2">
                    <Input
                      className="h-9 border-[#4A5260] bg-[#393E46] text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                      onChange={(event) => setNewRoleName(event.target.value)}
                      onKeyDown={handleCreateKeyDown}
                      placeholder="New role name"
                      value={newRoleName}
                    />
                  </div>
                </TableCell>
                <TableCell className={`${stickyScopeClassName} align-middle`}>
                  <Select onValueChange={handleNewRoleScopeChange} value={newRoleScope}>
                    <SelectTrigger className="h-9 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      className="w-[var(--radix-select-trigger-width)] min-w-0 border-[#4A5260] bg-[#393E46] text-[#EEEEEE]"
                      position="popper"
                      side="bottom"
                      sideOffset={4}
                    >
                      {SCOPE_OPTIONS.map((scopeOption) => (
                        <SelectItem key={scopeOption} value={scopeOption}>
                          {getScopeLabel(scopeOption)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className={`${stickyCodeClassName} align-middle`}>
                  <Input
                    className="h-9 border-[#4A5260] bg-[#393E46] font-mono text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                    onChange={(event) => setNewRoleCode(event.target.value)}
                    onKeyDown={handleCreateKeyDown}
                    placeholder="code"
                    value={newRoleCode}
                  />
                </TableCell>
                <TableCell className="bg-[#0f1822] align-middle text-center hover:bg-[#0f1822]">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={newRoleIsDefault}
                      className={checkboxClassName}
                      onCheckedChange={(checked) => setNewRoleIsDefault(Boolean(checked))}
                    />
                  </div>
                </TableCell>
                {permissionColumns.flatMap((permissionGroup) => {
                  const isExpanded =
                    permissionGroup.isExpandable && expandedGroups.includes(permissionGroup.group);
                  const scopePermissions = permissionGroup.permissions.filter(
                    (permission) => permission.scope === newRoleScope,
                  );
                  const scopePermissionIds = scopePermissions.map((permission) =>
                    getPermissionId(permission),
                  );
                  const isGroupChecked =
                    scopePermissionIds.length > 0 &&
                    scopePermissionIds.every((permissionId) =>
                      newRolePermissionIds.includes(permissionId),
                    );

                  return [
                    <TableCell
                      className={`${permissionGroupCellClassName} ${
                        permissionGroup.isExpandable && scopePermissionIds.length
                          ? 'cursor-pointer'
                          : ''
                      }`}
                      key={permissionGroup.group}
                      onClick={() =>
                        permissionGroup.isExpandable && scopePermissionIds.length
                          ? expandPermissionGroup(permissionGroup.group)
                          : undefined
                      }
                    >
                      <div className="flex justify-center">
                        {scopePermissionIds.length ? (
                          <Checkbox
                            checked={isGroupChecked}
                            className={checkboxClassName}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={(checked) =>
                              replaceNewRoleGroupPermissions(
                                permissionGroup.group,
                                permissionGroup.permissions,
                                Boolean(checked),
                              )
                            }
                          />
                        ) : (
                          <span className={unavailableTextClassName}>-</span>
                        )}
                      </div>
                    </TableCell>,
                    ...(isExpanded
                      ? permissionGroup.actions.map((action) => {
                          const permission = getNewRolePermissionByAction(
                            permissionGroup.permissions,
                            action,
                          );
                          const permissionId = permission ? getPermissionId(permission) : null;

                          return (
                            <TableCell
                              className={permissionActionCellClassName}
                              key={`${permissionGroup.group}-${action}`}
                            >
                              <div className="flex justify-center">
                                {permission && permissionId !== null ? (
                                  <Checkbox
                                    checked={newRolePermissionIds.includes(permissionId)}
                                    className={checkboxClassName}
                                    onCheckedChange={(checked) =>
                                      replaceNewRolePermission(permission, Boolean(checked))
                                    }
                                  />
                                ) : (
                                  <span className={unavailableTextClassName}>-</span>
                                )}
                              </div>
                            </TableCell>
                          );
                        })
                      : []),
                  ];
                })}
              </TableRow>

              {isLoading ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-[#aeb7c2]" colSpan={columnCount}>
                    Loading roles...
                  </TableCell>
                </TableRow>
              ) : roles.length ? (
                roles.map((role) => {
                  const selectedPermissionIds = new Set(getDraftRolePermissionIds(role));

                  return (
                    <TableRow
                      className="border-r-0 border-t-0 border-b-[#303842] bg-[#101820] align-middle hover:bg-[#101820]"
                      key={role.id}
                    >
                      <TableCell className={`${stickySelectClassName} px-5 align-middle`}>
                        <Checkbox
                          checked={selectedRoleIds.includes(role.id)}
                          className={checkboxClassName}
                          onCheckedChange={(checked) =>
                            toggleRoleSelection(role.id, Boolean(checked))
                          }
                        />
                      </TableCell>
                      <TableCell className={`${stickyRoleClassName} align-middle`}>
                        <div className="flex min-w-0 items-center gap-2 font-black text-white">
                          <span className="truncate">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`${stickyScopeClassName} align-middle`}>
                        <Badge className="border-[#4A5260] text-[#aeb7c2]" variant="outline">
                          {getScopeLabel(role.scope)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`${stickyCodeClassName} align-middle font-mono text-xs font-bold text-[#aeb7c2]`}
                      >
                        <span className="block truncate">{role.code}</span>
                      </TableCell>
                      <TableCell className="bg-[#101820] align-middle text-center hover:bg-[#101820]">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={getDraftRoleDefault(role)}
                            className={getRoleCheckboxClassName(hasDraftDefaultChanges(role))}
                            onCheckedChange={(checked) =>
                              replaceDraftRoleDefault(role, Boolean(checked))
                            }
                          />
                        </div>
                      </TableCell>
                      {permissionColumns.flatMap((permissionGroup) => {
                        const scopePermissions = permissionGroup.permissions.filter(
                          (permission) => permission.scope === role.scope,
                        );
                        const groupPermissionIds = scopePermissions.map((permission) =>
                          getPermissionId(permission),
                        );
                        const isExpanded =
                          permissionGroup.isExpandable &&
                          expandedGroups.includes(permissionGroup.group);
                        const isGroupChecked =
                          groupPermissionIds.length > 0 &&
                          groupPermissionIds.every((permissionId) =>
                            selectedPermissionIds.has(permissionId),
                          );
                        const isGroupChanged = isPermissionGroupDraftChanged(
                          role,
                          scopePermissions,
                        );

                        return [
                          <TableCell
                            className={`${permissionGroupCellClassName} ${
                              permissionGroup.isExpandable && groupPermissionIds.length
                                ? 'cursor-pointer'
                                : ''
                            }`}
                            key={`${role.id}-${permissionGroup.group}`}
                            onClick={() =>
                              permissionGroup.isExpandable && groupPermissionIds.length
                                ? expandPermissionGroup(permissionGroup.group)
                                : undefined
                            }
                          >
                            <div className="flex justify-center">
                              {groupPermissionIds.length ? (
                                <Checkbox
                                  checked={isGroupChecked}
                                  className={getRoleCheckboxClassName(isGroupChanged)}
                                  onClick={(event) => event.stopPropagation()}
                                  onCheckedChange={(checked) =>
                                    replaceDraftGroupPermissions(
                                      role,
                                      permissionGroup.group,
                                      scopePermissions,
                                      Boolean(checked),
                                    )
                                  }
                                />
                              ) : (
                                <span className={unavailableTextClassName}>-</span>
                              )}
                            </div>
                          </TableCell>,
                          ...(isExpanded
                            ? permissionGroup.actions.map((action) => {
                                const permission = getPermissionByAction(
                                  role,
                                  permissionGroup.permissions,
                                  action,
                                );
                                const permissionId = permission
                                  ? getPermissionId(permission)
                                  : null;

                                return (
                                  <TableCell
                                    className={permissionActionCellClassName}
                                    key={`${role.id}-${permissionGroup.group}-${action}`}
                                  >
                                    <div className="flex justify-center">
                                      {permission && permissionId !== null ? (
                                        <Checkbox
                                          checked={selectedPermissionIds.has(permissionId)}
                                          className={getRoleCheckboxClassName(
                                            isPermissionDraftChanged(role, permissionId),
                                          )}
                                          onCheckedChange={(checked) =>
                                            replaceDraftPermission(
                                              role,
                                              permission,
                                              Boolean(checked),
                                            )
                                          }
                                        />
                                      ) : (
                                        <span className={unavailableTextClassName}>-</span>
                                      )}
                                    </div>
                                  </TableCell>
                                );
                              })
                            : []),
                        ];
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="h-[72px] border-[#303842] bg-[#101820]">
                  <TableCell
                    className="px-5 text-xs font-bold text-[#aeb7c2]"
                    colSpan={columnCount}
                  >
                    No roles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          limit={limit}
          onLimitChange={onLimitChange}
          onPageChange={onPageChange}
          page={page}
          total={total}
          totalPages={totalPages}
        />
      </section>
    </TooltipProvider>
  );
}
