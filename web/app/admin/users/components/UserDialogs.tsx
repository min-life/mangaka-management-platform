'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import type { AdminRoleResponse, AdminUserResponse } from '../../admin-api';
import { AdminTextField, RoleCheckboxList } from './UserFormControls';

export function CreateStaffDialog({
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
  roles,
}: {
  isOpen?: boolean;
  isSubmitting: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (payload: { displayName?: string; email: string; roleIds: number[] }) => Promise<void>;
  roles: AdminRoleResponse[];
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [roleIds, setRoleIds] = useState<number[]>([]);

  const open = isOpen ?? internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (nextOpen) {
      setDisplayName('');
      setEmail('');
      setRoleIds([]);
    }
  };

  const handleSubmit = async () => {
    await onSubmit({
      displayName: displayName.trim() || undefined,
      email: email.trim(),
      roleIds,
    });
    setInternalOpen(false);
    onOpenChange?.(false);
    setDisplayName('');
    setEmail('');
    setRoleIds([]);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="bg-[#FFD369] text-[#222831] hover:bg-white">
          <UserPlus className="size-4" />
          Create Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#4A5260] bg-[#222831] text-[#EEEEEE]">
        <DialogHeader>
          <DialogTitle>Create Staff</DialogTitle>
          <DialogDescription className="text-[#aeb7c2]">
            Create an admin or staff account. A random password will be emailed after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <AdminTextField
            autoComplete="off"
            label="Display Name"
            onChange={setDisplayName}
            placeholder="Enter staff display name"
            value={displayName}
          />
          <AdminTextField
            autoComplete="new-email"
            label="Email"
            onChange={setEmail}
            placeholder="staff@example.com"
            type="email"
            value={email}
          />
          <RoleCheckboxList
            label="Roles"
            onChange={setRoleIds}
            roles={roles}
            selectedRoleIds={roleIds}
          />
        </div>
        <DialogFooter>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-white"
            disabled={isSubmitting || !email.trim() || roleIds.length === 0}
            onClick={() => void handleSubmit()}
          >
            Create Staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManageRolesDialog({
  currentRoles,
  isSubmitting,
  onSubmit,
  roles,
  user,
}: {
  currentRoles: AdminRoleResponse[];
  isSubmitting: boolean;
  onSubmit: (roleIds: number[]) => Promise<void>;
  roles: AdminRoleResponse[];
  user: AdminUserResponse;
}) {
  const [open, setOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    queueMicrotask(() => {
      setSelectedRoleIds(currentRoles.map((role) => Number(role.id)));
    });
  }, [currentRoles, open]);

  const handleSubmit = async () => {
    await onSubmit(selectedRoleIds);
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
          size="sm"
          variant="outline"
        >
          <ShieldCheck className="size-3.5" />
          Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#4A5260] bg-[#222831] text-[#EEEEEE]">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription className="text-[#aeb7c2]">
            Replace SYS roles assigned to {user.displayName || user.email}.
          </DialogDescription>
        </DialogHeader>
        <RoleCheckboxList
          onChange={setSelectedRoleIds}
          roles={roles}
          selectedRoleIds={selectedRoleIds}
        />
        <DialogFooter>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-white"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            Save Roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
