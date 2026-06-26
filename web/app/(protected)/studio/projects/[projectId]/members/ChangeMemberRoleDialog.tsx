'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProjectMemberResponse } from '@/services/project.service';
import type { RoleResponse } from '@/services/role.service';

type ChangeMemberRoleDialogProps = {
  isSubmitting: boolean;
  member: ProjectMemberResponse | null;
  onClose: () => void;
  onSubmit: (roleId: number) => void;
  roles: RoleResponse[];
};

export function ChangeMemberRoleDialog({
  isSubmitting,
  member,
  onClose,
  onSubmit,
  roles,
}: ChangeMemberRoleDialogProps) {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={Boolean(member)}
    >
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        {member ? (
          <ChangeMemberRoleForm
            isSubmitting={isSubmitting}
            key={member.id}
            member={member}
            onSubmit={onSubmit}
            roles={roles}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type ChangeMemberRoleFormProps = {
  isSubmitting: boolean;
  member: ProjectMemberResponse;
  onSubmit: (roleId: number) => void;
  roles: RoleResponse[];
};

function ChangeMemberRoleForm({
  isSubmitting,
  member,
  onSubmit,
  roles,
}: ChangeMemberRoleFormProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(member.role.id);
  const availableRoles = roles.some((role) => role.id === member.role.id)
    ? roles
    : [member.role, ...roles];

  return (
    <>
      <DialogHeader className="border-b border-[#39424f] px-6 py-5">
        <DialogTitle className="text-xl font-black text-white">Change Role</DialogTitle>
        <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
          Update {member.displayName ?? member.email}&apos;s role in this project.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 px-6 py-5">
        <div className="rounded-[4px] border border-[#303842] bg-[#151c25] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
            Current
          </p>
          <p className="mt-2 text-sm font-black text-white">{member.role.name}</p>
        </div>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
            New Role
          </span>
          <select
            className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
            onChange={(event) => setSelectedRoleId(Number(event.target.value))}
            value={selectedRoleId}
          >
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
        <DialogClose asChild>
          <Button
            className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
          disabled={isSubmitting || selectedRoleId === member.role.id}
          onClick={() => onSubmit(selectedRoleId)}
          type="button"
        >
          {isSubmitting ? 'Updating...' : 'Update Role'}
        </Button>
      </DialogFooter>
    </>
  );
}
