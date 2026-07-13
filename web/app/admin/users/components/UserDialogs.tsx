'use client';

import { useState } from 'react';
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

export function CreateUserDialog({
  isOpen,
  isSubmitting,
  onOpenChange,
  onLoadRoles,
  onSubmit,
  roles,
}: {
  isOpen?: boolean;
  isSubmitting: boolean;
  onLoadRoles: () => Promise<AdminRoleResponse[]>;
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
      queueMicrotask(() => {
        void onLoadRoles().catch(() => undefined);
      });
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
        <Button className="bg-[#FFD369] text-[#222831] hover:bg-white disabled:opacity-60">
          <UserPlus className="size-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#4A5260] bg-[#222831] text-[#EEEEEE]">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription className="text-[#aeb7c2]">
            Create a user with selected roles. The backend will email the generated password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <AdminTextField
            autoComplete="off"
            label="Display Name"
            onChange={setDisplayName}
            placeholder="Enter user display name"
            value={displayName}
          />
          <AdminTextField
            autoComplete="new-email"
            label="Email"
            onChange={setEmail}
            placeholder="user@example.com"
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
        <DialogFooter className="border-[#4A5260] bg-[#222831]">
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-white disabled:bg-[#FFD369] disabled:opacity-45"
            disabled={isSubmitting || !email.trim() || roleIds.length === 0}
            onClick={() => void handleSubmit()}
          >
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManageRolesDialog({
  currentRoles,
  hasLoadedCurrentRoles,
  isSubmitting,
  onLoadRoles,
  onLoadAvailableRoles,
  onSubmit,
  roles,
  user,
}: {
  currentRoles: AdminRoleResponse[];
  hasLoadedCurrentRoles: boolean;
  isSubmitting: boolean;
  onLoadAvailableRoles: () => Promise<AdminRoleResponse[]>;
  onLoadRoles: () => Promise<AdminRoleResponse[]>;
  onSubmit: (roleIds: number[]) => Promise<void>;
  roles: AdminRoleResponse[];
  user: AdminUserResponse;
}) {
  const [open, setOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoadingCurrentRoles, setIsLoadingCurrentRoles] = useState(false);
  const [hasResolvedCurrentRoles, setHasResolvedCurrentRoles] = useState(false);

  const loadCurrentRoles = async () => {
    setIsLoadingCurrentRoles(true);
    setHasResolvedCurrentRoles(false);

    try {
      await onLoadAvailableRoles();
      const nextRoles = hasLoadedCurrentRoles ? currentRoles : await onLoadRoles();
      setSelectedRoleIds(nextRoles.map((role) => Number(role.id)));
      setHasResolvedCurrentRoles(true);
    } catch {
      setSelectedRoleIds([]);
      setHasResolvedCurrentRoles(false);
    } finally {
      setIsLoadingCurrentRoles(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setHasResolvedCurrentRoles(false);
      return;
    }

    if (nextOpen) {
      queueMicrotask(() => {
        void loadCurrentRoles();
      });
    }
  };

  const handleSubmit = async () => {
    await onSubmit(selectedRoleIds);
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640] disabled:opacity-60"
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
        {isLoadingCurrentRoles ? (
          <div className="rounded-lg border border-[#4A5260] bg-[#393E46] px-4 py-5 text-center text-sm font-medium text-[#aeb7c2]">
            Loading current roles...
          </div>
        ) : null}
        {hasResolvedCurrentRoles && !isLoadingCurrentRoles ? (
          <RoleCheckboxList
            onChange={setSelectedRoleIds}
            roles={roles}
            selectedRoleIds={selectedRoleIds}
          />
        ) : null}
        <DialogFooter>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-white disabled:opacity-60"
            disabled={isSubmitting || isLoadingCurrentRoles}
            onClick={() => void handleSubmit()}
          >
            Save Roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
