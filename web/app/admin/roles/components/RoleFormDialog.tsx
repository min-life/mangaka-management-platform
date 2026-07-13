'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { type AdminPermissionResponse, type AdminRoleScope } from '../../admin-api';
import { getPermissionId, SCOPE_OPTIONS, type RoleFormPayload } from './role-utils';

export function RoleFormDialog({
  availablePermissions,
  defaultScope,
  isSubmitting,
  onSubmit,
  trigger,
}: {
  availablePermissions: AdminPermissionResponse[];
  defaultScope: AdminRoleScope;
  isSubmitting: boolean;
  onSubmit: (payload: RoleFormPayload) => Promise<void>;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<AdminRoleScope>(defaultScope);
  const [isDefault, setIsDefault] = useState(false);
  const [permissionIds, setPermissionIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    queueMicrotask(() => {
      setCode('');
      setName('');
      setScope(defaultScope);
      setIsDefault(false);
      setPermissionIds([]);
    });
  }, [defaultScope, open]);

  const togglePermission = (permissionId: number) => {
    setPermissionIds((currentPermissionIds) =>
      currentPermissionIds.includes(permissionId)
        ? currentPermissionIds.filter((currentPermissionId) => currentPermissionId !== permissionId)
        : [...currentPermissionIds, permissionId],
    );
  };

  const handleSubmit = async () => {
    await onSubmit({
      code: code.trim(),
      isDefault,
      name: name.trim(),
      permissionIds,
      scope,
    });
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-hidden border-[#4A5260] bg-[#222831] p-0 text-[#EEEEEE]">
        <DialogHeader>
          <div className="border-b border-[#4A5260] px-6 pt-6 pb-4">
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription className="mt-1 text-[#aeb7c2]">
              Save role metadata and permission assignments in one flow.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="admin-modal-scroll grid max-h-[58vh] gap-4 overflow-y-auto px-6 py-4">
          <AdminTextField label="Code" onChange={setCode} value={code} />
          <AdminTextField label="Name" onChange={setName} value={name} />
          <div className="grid gap-2">
            <Label>Scope</Label>
            <Select onValueChange={(value) => setScope(value as AdminRoleScope)} value={scope}>
              <SelectTrigger className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
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
                    {scopeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-3 text-sm text-[#EEEEEE]">
            <Checkbox
              checked={isDefault}
              className="data-checked:border-[#FFD369] data-checked:bg-[#FFD369] data-checked:text-[#222831]"
              onCheckedChange={(checked) => setIsDefault(Boolean(checked))}
            />
            Set as default role for {scope}
          </label>
          <div className="grid gap-2">
            <Label>Permissions</Label>
            <div className="admin-modal-scroll grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-[#4A5260] bg-[#393E46] p-3">
              {availablePermissions
                .filter((permission) => permission.scope === scope)
                .map((permission) => {
                  const permissionId = getPermissionId(permission);
                  return (
                    <label
                      className="flex items-center gap-3 text-sm text-[#EEEEEE]"
                      key={permission.id}
                    >
                      <Checkbox
                        checked={permissionIds.includes(permissionId)}
                        className="data-checked:border-[#FFD369] data-checked:bg-[#FFD369] data-checked:text-[#222831]"
                        onCheckedChange={() => togglePermission(permissionId)}
                      />
                      <span>{permission.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-[#4A5260] px-6 py-4">
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-white"
            disabled={isSubmitting || !code.trim() || !name.trim()}
            onClick={() => void handleSubmit()}
          >
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminTextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputId = `role-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
        id={inputId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </div>
  );
}
