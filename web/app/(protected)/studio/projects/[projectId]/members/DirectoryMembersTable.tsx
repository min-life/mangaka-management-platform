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
import { Pagination } from '../../../components/Pagination';

import { formatOptionalDate, getInitials, getRoleClassName } from './member-ui';

import { useAuth } from '@/hooks/useAuth';

type DirectoryMembersTableProps = {
  filteredMembers: ProjectMemberResponse[];
  isLoading: boolean;
  onChangeRole: (member: ProjectMemberResponse) => void;
  onRemoveMember: (member: ProjectMemberResponse) => void;
  canUpdateMember?: boolean;
  canRemoveMember?: boolean;
  onViewMember: (member: ProjectMemberResponse) => void;
  totalMembers: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  visibleCount: number;
};

export function DirectoryMembersTable({
  filteredMembers,
  isLoading,
  onChangeRole,
  onRemoveMember,
  canUpdateMember,
  canRemoveMember,
  onViewMember,
  totalMembers,
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  visibleCount,
}: DirectoryMembersTableProps) {
  const { user: currentUser } = useAuth();
  const skeletonRows = Array.from({ length: 5 });

  return (
    <section className="mt-4 overflow-hidden rounded-[5px] border border-[#39424f] bg-[#101820]">
      <Table>
        <TableHeader>
          <TableRow className="h-[40px] border-[#39424f] bg-[#222a34] hover:bg-[#222a34]">
            <TableHead className="w-[35%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Member
            </TableHead>
            <TableHead className="w-[25%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Project Role
            </TableHead>
            <TableHead className="w-[18%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Joined
            </TableHead>
            <TableHead className="w-[18%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Last Updated
            </TableHead>
            <TableHead className="w-[72px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            skeletonRows.map((_, index) => (
              <TableRow
                className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#303842] bg-[#101820]"
                key={index}
              >
                <TableCell className="px-5">
                  <div className="flex items-center gap-4">
                    <div className="size-10 animate-pulse rounded-[4px] bg-[#1f2937]" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded-[4px] bg-[#1f2937]" />
                      <div className="h-3 w-52 animate-pulse rounded-[4px] bg-[#1f2937]" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-28 animate-pulse rounded-[3px] bg-[#1f2937]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded-[4px] bg-[#1f2937]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded-[4px] bg-[#1f2937]" />
                </TableCell>
                <TableCell className="pr-5">
                  <div className="ml-auto size-7 animate-pulse rounded-[4px] bg-[#1f2937]" />
                </TableCell>
              </TableRow>
            ))
          ) : filteredMembers.length ? (
            filteredMembers.map((member) => (
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black leading-5 text-white">
                          {member.displayName ?? member.email}
                        </p>
                        {currentUser?.id === member.id && (
                          <Badge className="h-4 rounded-[3px] border-none bg-[#FFD369] px-1.5 text-[9px] font-black text-[#222831] hover:bg-[#FFD369]">
                            ME
                          </Badge>
                        )}
                      </div>
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
                <TableCell className="text-xs font-bold text-[#dce7f3]">
                  {formatOptionalDate(member.createdAt)}
                </TableCell>
                <TableCell className="text-xs font-bold text-[#aeb7c2]">
                  {formatOptionalDate(member.updatedAt)}
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
                      {member.role.name !== 'Owner' && (
                        <>
                          {canUpdateMember && (
                            <DropdownMenuItem
                              className="gap-2 rounded-[3px] text-xs font-bold focus:bg-[#303842] focus:text-white"
                              onClick={() => onChangeRole(member)}
                            >
                              <UserCog className="size-4" />
                              Change Role
                            </DropdownMenuItem>
                          )}
                          {(canRemoveMember || member.id === currentUser?.id) && (
                            <DropdownMenuItem
                              className="gap-2 rounded-[3px] text-xs font-bold text-red-300 focus:bg-red-950/30 focus:text-red-200"
                              onClick={() => onRemoveMember(member)}
                            >
                              <Trash2 className="size-4" />
                              {member.id === currentUser?.id ? 'Leave Project' : 'Remove Member'}
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="h-[72px] border-[#303842] bg-[#101820]">
              <TableCell className="px-5 text-xs font-bold text-[#aeb7c2]" colSpan={6}>
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        page={page}
        limit={limit}
        total={totalMembers}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </section>
  );
}
