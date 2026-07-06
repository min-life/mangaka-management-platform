'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CircleGauge,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserResponse } from '@/services/user.service';

import {
  addEditorialMembers,
  getAvailableEditorialUsers,
  getEditorialMembers,
  getEditorialMembersSummary,
  removeEditorialMember,
  setEditorialMemberAsLead,
  type EditorialMember,
  type EditorialMembersSummary,
} from '../services/editorial-members-service';

function getInitials(name?: string | null, email?: string) {
  const label = name || email || 'Member';
  return label
    .split(/[.@\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value?: string) {
  if (!value) {
    return 'Not returned';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function MemberAvatar({ member, size = 'md' }: { member: EditorialMember; size?: 'lg' | 'md' }) {
  const dimension = size === 'lg' ? 'size-14' : 'size-10';

  return (
    <Avatar className={`${dimension} rounded-[4px] border border-[#50555D] bg-[#2f353e]`}>
      <AvatarImage
        alt={member.displayName ?? member.email}
        className="object-cover"
        src={member.avatarUrl ?? undefined}
      />
      <AvatarFallback className="rounded-[4px] bg-[#202832] text-xs font-black text-[#FFD369]">
        {getInitials(member.displayName, member.email)}
      </AvatarFallback>
    </Avatar>
  );
}

function AddBoardMemberDialog({
  existingMemberIds,
  onAddMembers,
}: {
  existingMemberIds: number[];
  onAddMembers: (users: UserResponse[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const unavailableIds = new Set([...existingMemberIds, ...selectedUsers.map((user) => user.id)]);

    if (!normalizedQuery) {
      return [];
    }

    return users
      .filter((user) => !unavailableIds.has(user.id))
      .filter((user) => {
        return [user.email, user.displayName ?? ''].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .slice(0, 8);
  }, [existingMemberIds, searchQuery, selectedUsers, users]);

  useEffect(() => {
    if (!open || users.length > 0 || isLoadingUsers) {
      return;
    }

    queueMicrotask(() => {
      setIsLoadingUsers(true);
      setError(null);

      void getAvailableEditorialUsers()
        .then(setUsers)
        .catch(() => setError('Unable to load users.'))
        .finally(() => setIsLoadingUsers(false));
    });
  }, [isLoadingUsers, open, users.length]);

  const reset = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUsers.length || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddMembers(selectedUsers);
      reset();
      setOpen(false);
    } catch {
      setError('Unable to add board members.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-10 rounded-[4px] bg-white px-5 text-[13px] font-medium text-[#2f3131] hover:bg-[#c6c6c7]">
          <UserPlus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[760px] max-w-[calc(100vw-32px)] gap-0 overflow-hidden rounded-[8px] border border-[#50555D] bg-[#101820] p-0 text-white ring-0 sm:max-w-[760px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#FFD369]">
            Editorial Board
          </p>
          <DialogTitle className="text-[24px] font-semibold leading-8 text-white">
            Add Editorial Members
          </DialogTitle>
          <DialogDescription className="text-sm text-[#C8C8C8]">
            Select existing users and grant them access to this editor board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 md:grid-cols-[1fr_280px]">
            <div>
              <label
                className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]"
                htmlFor="board-member-search"
              >
                Search Users
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b94a1]" />
                <Input
                  className="h-10 rounded-[4px] border-[#50555D] bg-[#0e141c] pl-10 text-sm text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                  id="board-member-search"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or email..."
                  value={searchQuery}
                />
              </div>
              <div className="mt-3 h-[300px] overflow-y-auto rounded-[4px] border border-[#39424f] bg-[#0c1219] p-1">
                {isLoadingUsers ? (
                  <p className="px-3 py-3 text-xs font-bold text-[#8b94a1]">Loading users...</p>
                ) : !searchQuery.trim() ? (
                  <p className="px-3 py-3 text-xs font-bold text-[#8b94a1]">Type name or email to search...</p>
                ) : filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <button
                      className="group flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-left hover:bg-[#202832]"
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
                          className="size-9 rounded-[4px] border border-[#39424f] object-cover"
                          src={user.avatarUrl}
                        />
                      ) : (
                        <span className="grid size-9 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-[10px] font-black text-[#FFD369]">
                          {getInitials(user.displayName, user.email)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black text-white">
                          {user.displayName ?? user.email}
                        </span>
                        <span className="block truncate text-[11px] font-bold text-[#8b94a1]">
                          {user.email}
                        </span>
                      </span>
                      <Plus className="ml-auto size-4 text-[#8b94a1] opacity-0 group-hover:opacity-100" />
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-xs font-bold text-[#8b94a1]">No users found.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                Selected
              </p>
              <div className="mt-2 min-h-[300px] rounded-[4px] border border-[#39424f] bg-[#0c1219] p-2">
                {selectedUsers.length ? (
                  <div className="grid gap-2">
                    {selectedUsers.map((user) => (
                      <span
                        className="flex min-h-12 items-center gap-3 rounded-[3px] bg-[#202832] px-3 py-2"
                        key={user.id}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-[4px] border border-[#39424f] bg-[#101820] text-[10px] font-black text-[#FFD369]">
                          {getInitials(user.displayName, user.email)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-black text-white">
                            {user.displayName ?? user.email}
                          </span>
                          <span className="block truncate text-[10px] font-bold text-[#8b94a1]">
                            {user.email}
                          </span>
                        </span>
                        <button
                          className="grid size-6 shrink-0 place-items-center rounded-full text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
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
                  <div className="grid min-h-[280px] place-items-center text-center">
                    <p className="max-w-[200px] text-xs font-bold leading-5 text-[#8b94a1]">
                      Select users from the directory to add them to this board.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error ? <p className="md:col-span-2 text-xs font-bold text-red-300">{error}</p> : null}
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
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
              disabled={!selectedUsers.length || isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Adding...' : `Add Member${selectedUsers.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberDetailDrawer({
  member,
  onClose,
}: {
  member: EditorialMember | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(member)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-[400px] max-w-[calc(100vw-32px)] gap-0 border-[#50555D] bg-[#1a2029] p-0 text-[#dde3ef] sm:max-w-[400px]"
        side="right"
        showCloseButton={false}
      >
        {member ? (
          <>
            <SheetHeader className="border-b border-[#50555D] bg-[#242a33] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <MemberAvatar member={member} size="lg" />
                  <div>
                    <SheetTitle className="text-[22px] font-semibold leading-7 text-white">
                      {member.displayName ?? member.email}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-[#C8C8C8]">
                      {member.roleTitle}
                    </SheetDescription>
                  </div>
                </div>
                <button
                  aria-label="Close member details"
                  className="grid size-8 place-items-center rounded-[4px] text-[#C8C8C8] hover:bg-[#2f353e] hover:text-white"
                  onClick={onClose}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </SheetHeader>

            <div className="space-y-6 p-6">
              <div className="rounded-[8px] border border-[#50555D] bg-[#0e141c] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                  Contact
                </p>
                <p className="mt-2 text-sm font-medium text-white">{member.email}</p>
                <p className="mt-1 text-xs text-[#C8C8C8]">{member.region}*</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-[#50555D] bg-[#0e141c] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Projects
                  </p>
                  <p className="mt-2 text-[28px] font-bold leading-8 text-white">
                    {member.activeProjects}
                  </p>
                </div>
                <div className="rounded-[8px] border border-[#50555D] bg-[#0e141c] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Reviews
                  </p>
                  <p className="mt-2 text-[28px] font-bold leading-8 text-[#FFD369]">
                    {member.reviewLoad}
                  </p>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#50555D] bg-[#0e141c] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                  Board Access
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[#C8C8C8]">Lead privileges</span>
                  <span
                    className={member.isLead ? 'font-semibold text-emerald-300' : 'text-[#C8C8C8]'}
                  >
                    {member.isLead ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[#C8C8C8]">Joined</span>
                  <span className="text-white">{formatDate(member.joinedAt)}</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function EditorialMembersManagementPage() {
  const params = useParams<{ editorBoardId?: string }>();
  const editorBoardId = params.editorBoardId ?? '1';
  const [members, setMembers] = useState<EditorialMember[]>([]);
  const [summary, setSummary] = useState<EditorialMembersSummary | null>(null);
  const [selectedMember, setSelectedMember] = useState<EditorialMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextMembers, nextSummary] = await Promise.all([
        getEditorialMembers(editorBoardId),
        getEditorialMembersSummary(editorBoardId),
      ]);
      setMembers(nextMembers);
      setSummary(nextSummary);
    } catch {
      setError('Unable to load editorial members.');
    } finally {
      setIsLoading(false);
    }
  }, [editorBoardId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const visibleMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !normalizedSearch ||
        [member.displayName ?? '', member.email, member.roleTitle, member.region].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      return matchesSearch;
    });
  }, [members, searchTerm]);

  const handleAddMembers = async (users: UserResponse[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await addEditorialMembers(
        editorBoardId,
        users.map((nextUser) => nextUser.id),
      );
      await loadMembers();
    } catch {
      setError('Unable to add board members.');
      throw new Error('Unable to add board members.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetLead = async (member: EditorialMember) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await setEditorialMemberAsLead(editorBoardId, member.id);
      setMembers((currentMembers) =>
        currentMembers.map((currentMember) => ({
          ...currentMember,
          isLead: currentMember.id === member.id,
          roleTitle: currentMember.id === member.id ? 'Lead Editor' : 'Editorial Member',
          userEditorBoard: {
            ...currentMember.userEditorBoard,
            isLead: currentMember.id === member.id,
          },
        })),
      );
      await loadMembers();
    } catch {
      setError('Unable to set board lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (member: EditorialMember) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await removeEditorialMember(editorBoardId, member.id);
      setSelectedMember(null);
      await loadMembers();
    } catch {
      setError('Unable to remove board member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="p-6">
          <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-[32px] font-bold leading-10 text-white">
                Editorial Members Management
              </h1>
              <p className="mt-1 text-sm leading-5 text-[#C8C8C8]">
                Manage board access, lead ownership, and editorial workload across this team.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="relative w-[320px] max-w-full">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b94a1]" />
                <Input
                  className="h-10 rounded-[4px] border-[#50555D] bg-[#161c25] pl-10 text-sm text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search members..."
                  value={searchTerm}
                />
              </div>
              <AddBoardMemberDialog
                existingMemberIds={members.map((member) => member.id)}
                onAddMembers={handleAddMembers}
              />
            </div>
          </section>

          {error ? (
            <p className="mb-6 rounded-[6px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
              {error}
            </p>
          ) : null}

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: Users, label: 'Total Members', value: summary?.totalMembers ?? 0 },
              { icon: ShieldCheck, label: 'Board Leads', value: summary?.leadMembers ?? 0 },
              { icon: CircleGauge, label: 'Review Load', value: summary?.reviewLoad ?? 0 },
            ].map((item) => (
              <article
                className="rounded-[8px] border border-[#50555D] bg-[#1a2029] p-5"
                key={item.label}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    {item.label}
                  </p>
                  <item.icon className="size-5 text-[#FFD369]" />
                </div>
                <p className="mt-3 text-[32px] font-bold leading-10 text-white">{item.value}</p>
              </article>
            ))}
          </section>

          <section>
            <div className="overflow-hidden rounded-[8px] border border-[#50555D] bg-[#1a2029]">
              <Table>
                <TableHeader className="bg-[#242a33]">
                  <TableRow className="border-[#50555D] hover:bg-transparent">
                    <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                      Member
                    </TableHead>
                    <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                      Board Role
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                      Projects
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                      Reviews
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow className="border-[#50555D]" key={index}>
                        {Array.from({ length: 5 }).map((__, cellIndex) => (
                          <TableCell className="px-4 py-4" key={cellIndex}>
                            <Skeleton className="h-8 rounded-[4px] bg-[#2f353e]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : visibleMembers.length ? (
                    visibleMembers.map((member) => (
                      <TableRow
                        className="cursor-pointer border-[#50555D] transition-colors hover:bg-[#50555D]/20"
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <MemberAvatar member={member} />
                            <div>
                              <p className="text-[13px] font-medium text-white">
                                {member.displayName ?? member.email}
                              </p>
                              <p className="mt-1 text-xs text-[#C8C8C8]">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Badge className="rounded-[4px] border-[#50555D] bg-[#202832] px-2 py-1 text-[11px] font-semibold text-white">
                              {member.roleTitle}
                            </Badge>
                            {member.isLead ? (
                              <ShieldCheck className="size-4 text-[#FFD369]" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right font-mono text-sm text-[#dde3ef]">
                          {member.activeProjects}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right font-mono text-sm text-[#FFD369]">
                          {member.reviewLoad}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label={`Open actions for ${member.displayName ?? member.email}`}
                                className="text-[#C8C8C8] hover:text-white"
                                onClick={(event) => event.stopPropagation()}
                                type="button"
                              >
                                <MoreVertical className="size-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-44 border-[#39424f] bg-[#151c25] text-white"
                            >
                              <DropdownMenuItem
                                className="gap-2 focus:bg-[#303842] focus:text-white"
                                onClick={() => setSelectedMember(member)}
                              >
                                <User className="size-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 focus:bg-[#303842] focus:text-white"
                                disabled={member.isLead || isSubmitting}
                                onClick={() => void handleSetLead(member)}
                              >
                                <ShieldCheck className="size-4" />
                                Set as Lead
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-red-300 focus:bg-red-950/30 focus:text-red-200"
                                disabled={isSubmitting}
                                onClick={() => void handleRemove(member)}
                              >
                                <Trash2 className="size-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-[#50555D]">
                      <TableCell
                        className="px-4 py-10 text-center text-sm text-[#C8C8C8]"
                        colSpan={5}
                      >
                        No editorial members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

          </section>
      </main>
      <MemberDetailDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
    </>
  );
}
