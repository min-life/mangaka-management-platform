'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Plus, Search, UserPlus, X } from 'lucide-react';
import { toast } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addProjectMembers } from '@/services/project.service';
import type { RoleResponse } from '@/services/role.service';
import { getUsers, type UserResponse } from '@/services/user.service';

const fieldClassName =
  'h-10 rounded-[4px] border-[#4b535f] bg-[#111922] px-3 text-sm font-semibold text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20';

const labelClassName = 'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : 'Add member failed.';
  }

  return 'Add member failed.';
}

type AddMemberDialogProps = {
  onAdded?: () => void;
  projectId: number;
  roles: RoleResponse[];
};

export function AddMemberDialog({ onAdded, projectId, roles }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultRoleId = roles.find((role) => role.isDefault)?.id ?? roles[0]?.id;
  const selectedRoleId = roleId || (defaultRoleId ? String(defaultRoleId) : '');

  const userIds = selectedUsers.map((user) => user.id);
  const canSubmit = userIds.length > 0 && Number(selectedRoleId) > 0 && !isSubmitting;
  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const selectedIds = new Set(selectedUsers.map((user) => user.id));

    if (!normalizedQuery) {
      return [];
    }

    return users
      .filter((user) => !selectedIds.has(user.id))
      .filter((user) => {
        return [user.email, user.displayName ?? ''].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .slice(0, 6);
  }, [searchQuery, selectedUsers, users]);

  useEffect(() => {
    if (!open || users.length > 0 || isLoadingUsers) {
      return;
    }

    queueMicrotask(() => {
      setIsLoadingUsers(true);
      setError(null);

      void getUsers()
        .then((nextUsers) => {
          setUsers(nextUsers);
        })
        .catch((loadError) => {
          setError(getErrorMessage(loadError));
        })
        .finally(() => {
          setIsLoadingUsers(false);
        });
    });
  }, [isLoadingUsers, open, users.length]);

  const resetForm = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setRoleId('');
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addProjectMembers(projectId, {
        roleId: Number(selectedRoleId),
        userIds,
      });
      toast.success('Member invited.');
      setSelectedUsers([]);
      setSearchQuery('');
      onAdded?.();
      setOpen(false);
    } catch (submitError) {
      const errMsg = getErrorMessage(submitError);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#101820] hover:bg-[#eac04f]">
          <UserPlus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[88dvh] max-w-[760px] gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#0c1219] p-0 text-[#eeeeee] ring-0 sm:max-w-[760px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#FFD369]">
            Project Members
          </p>
          <DialogTitle className="text-[22px] font-black leading-7 text-white">
            Add Member
          </DialogTitle>
          <DialogDescription className="max-w-2xl text-sm font-medium leading-5 text-[#aeb7c2]">
            Search users, stage them on the right, then assign one project role.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[calc(88dvh-124px)] flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="flex h-[400px] gap-6 md:grid-cols-[1fr_280px] md:grid">
              <div className="flex min-h-0 flex-col">
                <div className="space-y-2 mb-4">
                  <label className={labelClassName} htmlFor="member_search">
                    Search User
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b94a1]" />
                    <Input
                      className={`${fieldClassName} pl-10`}
                      id="member_search"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by name or email..."
                      value={searchQuery}
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-1">
                  {isLoadingUsers ? (
                    <div className="space-y-1 px-2 py-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div className="flex items-center gap-3 rounded-[3px] px-1 py-2.5" key={index}>
                          <div className="size-8 animate-pulse rounded-full bg-[#1f2937]" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-3 w-32 animate-pulse rounded-[4px] bg-[#1f2937]" />
                            <div className="h-3 w-44 animate-pulse rounded-[4px] bg-[#1f2937]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !searchQuery.trim() ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <p className="text-xs font-bold text-[#8b94a1]">
                        Type name or email to search users...
                      </p>
                    </div>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((user) => (
                      <button
                        className="group flex w-full items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#101820] px-3 py-2.5 text-left transition-colors hover:border-[#FFD369]/50 hover:bg-[#1a232e]"
                        key={user.id}
                        onClick={() => {
                          setSelectedUsers((currentUsers) => [...currentUsers, user]);
                          setSearchQuery('');
                        }}
                        type="button"
                      >
                        {user.avatarUrl ? (
                          <img
                            alt=""
                            className="size-8 rounded-full border border-[#39424f] object-cover"
                            src={user.avatarUrl}
                          />
                        ) : (
                          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#39424f] bg-[#202832] text-[10px] font-black text-[#FFD369]">
                            {(user.displayName ?? user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-black text-white">
                            {user.displayName ?? user.email}
                          </span>
                          <span className="block truncate text-[11px] font-bold text-[#8b94a1]">
                            {user.email}
                          </span>
                        </span>
                        <span className="ml-auto grid size-7 shrink-0 place-items-center rounded-[3px] border border-transparent text-[#8b94a1] opacity-0 transition-opacity group-hover:border-[#39424f] group-hover:opacity-100 group-hover:text-white">
                          <Plus className="size-4" />
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center text-center">
                      <p className="text-xs font-bold text-[#8b94a1]">
                        No users found.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-col gap-4 border-l border-[#39424f] pl-6">
                <div className="space-y-2">
                  <label className={labelClassName}>Role for selected members</label>
                  <Select onValueChange={setRoleId} value={selectedRoleId}>
                    <SelectTrigger className={`${fieldClassName} w-full`}>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent className="border-[#4b535f] bg-[#151c25] text-white" position="popper">
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex min-h-0 flex-1 flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={labelClassName}>Selected Members</p>
                    <span className="text-[10px] font-black text-[#8b94a1]">
                      {selectedUsers.length}
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto rounded-[4px] border border-[#39424f] bg-[#111922] p-2">
                    {selectedUsers.length ? (
                      <div className="grid gap-2">
                        {selectedUsers.map((user) => (
                          <span
                            className="flex min-h-12 min-w-0 items-center gap-3 rounded-[3px] bg-[#202832] px-3 py-2 text-xs font-bold text-white"
                            key={user.id}
                          >
                            {user.avatarUrl ? (
                              <img
                                alt=""
                                className="size-8 shrink-0 rounded-full border border-[#39424f] object-cover"
                                src={user.avatarUrl}
                              />
                            ) : (
                              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#39424f] bg-[#101820] text-[10px] font-black text-[#FFD369]">
                                {(user.displayName ?? user.email).charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-black text-white">
                                {user.displayName ?? user.email}
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] font-bold text-[#8b94a1]">
                                {user.email}
                              </span>
                            </span>
                            <button
                              className="grid size-5 shrink-0 place-items-center rounded-[3px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
                              onClick={() =>
                                setSelectedUsers((currentUsers) =>
                                  currentUsers.filter((currentUser) => currentUser.id !== user.id),
                                )
                              }
                              type="button"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-center px-4">
                        <div>
                          <p className="text-xs font-black text-[#dce7f3]">No members selected.</p>
                          <p className="mt-1 text-[11px] font-bold leading-5 text-[#8b94a1]">
                            Search users on the left to add them.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] font-bold text-[#8b94a1]">
                  This role will be assigned to every selected member.
                </p>
              </div>

              {error ? <p className="md:col-span-2 text-xs font-bold text-red-300">{error}</p> : null}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#39424f] bg-[#101820] px-6 py-3">
            <DialogClose asChild>
              <Button
                className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-5 text-xs font-black text-white hover:bg-[#303842]"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="h-9 rounded-[4px] bg-[#FFD369] px-5 text-xs font-black text-[#101820] hover:bg-[#eac04f]"
              disabled={!canSubmit}
              type="submit"
            >
              {isSubmitting
                ? 'Adding...'
                : `Add Member${selectedUsers.length === 1 ? '' : 's'}${
                    selectedUsers.length ? ` (${selectedUsers.length})` : ''
                  }`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
