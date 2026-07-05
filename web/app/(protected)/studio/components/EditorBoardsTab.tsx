'use client';

import Link from 'next/link';
import { Loader2, MoreVertical, Pencil, Trash2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
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

import { Pagination } from './Pagination';

function SortIcon({
  activeField,
  activeOrder,
  field,
}: {
  activeField?: string;
  activeOrder?: string;
  field: string;
}) {
  if (activeField !== field) {
    return <ChevronsUpDown className="size-3.5 text-[#8b94a1]" />;
  }
  if (activeOrder === 'asc') {
    return <ChevronUp className="size-3.5 text-[#FFD369]" />;
  }
  return <ChevronDown className="size-3.5 text-[#FFD369]" />;
}

type EditorBoardsTabProps = {
  boardRows: any[];
  boardTotal: number;
  isLoadingBoards: boolean;
  onRenameBoard: (board: any) => void;
  onDeleteBoard: (board: any) => void;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortField?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  onSort: (field: 'name' | 'createdAt') => void;
};

export function EditorBoardsTab({
  boardRows,
  boardTotal,
  isLoadingBoards,
  onRenameBoard,
  onDeleteBoard,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  sortField,
  sortOrder,
  onSort,
}: EditorBoardsTabProps) {
  return (
    <section className="mt-5 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
      <Table>
        <TableHeader>
          <TableRow className="h-[40px] border-[#393E46] bg-[#252e38] hover:bg-[#252e38]">
            <TableHead 
              className="w-[45%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1.5">
                Board
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="name" />
              </div>
            </TableHead>
            <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Created By
            </TableHead>
            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Projects
            </TableHead>
            <TableHead 
              className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center gap-1.5">
                Last Updated
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="createdAt" />
              </div>
            </TableHead>
            <TableHead className="w-[90px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingBoards ? (
            <TableRow>
              <TableCell colSpan={5} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="size-6 animate-spin text-[#FFD369]" />
                  <span className="text-xs font-bold text-[#8b94a1]">Loading editor boards...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : boardRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-40 text-center text-xs font-bold text-[#8b94a1]">
                No editor boards found.
              </TableCell>
            </TableRow>
          ) : (
            boardRows.map((board) => (
              <TableRow
                className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] hover:border-l-[#FFD369] hover:bg-[#202832]"
                key={board.id}
              >
                <TableCell className="px-5">
                  <Link
                    className="flex items-center gap-4 rounded-[4px] outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#FFD369]"
                    href={`/studio/editor-boards/${board.boardId}/projects`}
                  >
                    {board.image && board.image.trim() !== '' ? (
                      <img
                        alt=""
                        className="size-12 rounded-[5px] border border-[#393E46] object-cover"
                        src={board.image || undefined}
                      />
                    ) : (
                      <span className="grid size-12 place-items-center rounded-[5px] border border-[#393E46] bg-[#151c25] text-xs font-black text-[#FFD369]">
                        {board.name
                          .split(' ')
                          .slice(0, 2)
                          .map((word: string) => word.charAt(0))
                          .join('')}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-black leading-5 text-white">{board.name}</p>
                      <p className="mt-1 text-xs font-bold text-[#aeb7c2]">{board.id}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {board.createdBy}
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {board.projectCount} {board.projectCount === 1 ? 'project' : 'projects'}
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {board.updated}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Can
                    any={['admin', 'board:owner']}
                    resource="BOARD"
                    resourceId={board.boardId}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="size-7 text-white hover:bg-[#393E46]"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-36 rounded-[4px] border border-[#393E46] bg-[#101820] p-1 text-white"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#393E46] focus:text-white"
                          onSelect={() => void onRenameBoard(board)}
                        >
                          <Pencil className="size-3.5" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold text-red-300 focus:bg-red-950/30 focus:text-red-200"
                          onSelect={() => void onDeleteBoard(board)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Can>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </section>
  );
}
