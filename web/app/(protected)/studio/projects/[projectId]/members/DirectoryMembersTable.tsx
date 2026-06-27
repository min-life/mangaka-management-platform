'use client';

import { Eye, MoreVertical, Trash2, UserCog } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProjectMemberResponse } from '@/services/project.service';

import { formatOptionalDate, getInitials, getMemberTaskSummary, getRoleClassName } from './member-ui';

type DirectoryMembersTableProps = {
  filteredMembers: ProjectMemberResponse[];
  isLoading: boolean;
  onChangeRole: (member: ProjectMemberResponse) => void;
  onRemoveMember: (member: ProjectMemberResponse) => void;
  onViewMember: (member: ProjectMemberResponse) => void;
  totalMembers: number;
};

export function DirectoryMembersTable({
  filteredMembers,
  isLoading,
  onChangeRole,
  onRemoveMember,
  onViewMember,
  totalMembers,
}: DirectoryMembersTableProps) {
  return (
    <section className="mt-4 overflow-hidden rounded-[5px] border border-[#39424f] bg-[#101820]">
      <Table>
        <TableHeader>
          <TableRow className="h-[40px] border-[#39424f] bg-[#222a34] hover:bg-[#222a34]">
            <TableHead className="w-[34%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Member
            </TableHead>
            <TableHead className="w-[22%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Project Role
            </TableHead>
            <TableHead className="w-[16%] text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Assigned Tasks *
            </TableHead>
            <TableHead className="w-[16%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Joined
            </TableHead>
            <TableHead className="w-[72px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="h-[72px] border-[#303842] bg-[#101820]">
              <TableCell className="px-5 text-xs font-bold text-[#aeb7c2]" colSpan={5}>
                Loading members...
              </TableCell>
            </TableRow>
          ) : filteredMembers.length ? (
            filteredMembers.map((member) => {
              const taskSummary = getMemberTaskSummary(member);

              return (
                <TableRow
                  className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#303842] bg-[#101820] hover:border-l-[#FFD369] hover:bg-[#17202b]"
                  key={member.id}
                >
                  <TableCell className="px-5">
                    <div className="flex items-center gap-4">
                      {member.avatarUrl ? (
                        <img
                          alt=""
                          className="size-10 rounded-[4px] border border-[#39424f] object-cover"
                          src={member.avatarUrl}
                        />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-xs font-black text-[#FFD369]">
                          {getInitials(member)}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-black leading-5 text-white">
                          {member.displayName ?? member.email}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[#aeb7c2]">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`h-6 rounded-[3px] border px-3 text-[10px] font-black ${getRoleClassName(
                        member.role.name,
                      )}`}
                      variant="outline"
                    >
                      {member.role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-black text-[#FFD369]">
                    {taskSummary.assigned} tasks *
                  </TableCell>
                  <TableCell className="text-xs font-bold text-[#dce7f3]">
                    {formatOptionalDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="size-7 text-white hover:bg-[#303842]"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-44 rounded-[5px] border-[#39424f] bg-[#151c25] p-1 text-white"
                      >
                        <DropdownMenuItem
                          className="gap-2 rounded-[3px] text-xs font-bold focus:bg-[#303842] focus:text-white"
                          onClick={() => onViewMember(member)}
                        >
                          <Eye className="size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 rounded-[3px] text-xs font-bold focus:bg-[#303842] focus:text-white"
                          onClick={() => onChangeRole(member)}
                        >
                          <UserCog className="size-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 rounded-[3px] text-xs font-bold text-red-300 focus:bg-red-950/30 focus:text-red-200"
                          onClick={() => onRemoveMember(member)}
                        >
                          <Trash2 className="size-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow className="h-[72px] border-[#303842] bg-[#101820]">
              <TableCell className="px-5 text-xs font-bold text-[#aeb7c2]" colSpan={5}>
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <footer className="flex h-[54px] items-center justify-between border-t border-[#39424f] bg-[#151c25] px-5">
        <div className="flex items-center gap-5 text-[11px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
          <span>Total Members: {totalMembers}</span>
          <span>Visible: {filteredMembers.length}</span>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
          Page 1 of 1
        </p>
      </footer>
    </section>
  );
}
