'use client';

import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const taskStatusClassName: Record<string, string> = {
  DONE: 'border-[#315846] bg-[#14291f] text-[#9df2c7]',
  INPROGRESS: 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]',
  PENDING: 'border-[#4a4f55] bg-[#20282b] text-[#f2f6f4]',
  REVIEW: 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
};

const statusLabel: Record<string, string> = {
  DONE: 'Done',
  INKING: 'Inking',
  INPROGRESS: 'In Progress',
  PENDING: 'Pending',
  REVIEW: 'Review',
  'SCRIPT PHASE': 'Script Phase',
  STORYBOARD: 'Storyboard',
};

function formatStatus(status: string) {
  return statusLabel[status] ?? status;
}

import { Pagination } from './Pagination';

type MyTasksTabProps = {
  mappedTasks: any[];
  isLoadingTasks: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function MyTasksTab({
  mappedTasks,
  isLoadingTasks,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: MyTasksTabProps) {
  return (
    <section className="mt-5 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
      <Table>
        <TableHeader>
          <TableRow className="h-[40px] border-[#393E46] bg-[#252e38] hover:bg-[#252e38]">
            <TableHead className="w-[42%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Task
            </TableHead>
            <TableHead className="w-[220px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Project
            </TableHead>
            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Assignee
            </TableHead>
            <TableHead className="w-[160px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Status
            </TableHead>
            <TableHead className="w-[130px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Due
            </TableHead>
            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingTasks ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="size-6 animate-spin text-[#FFD369]" />
                  <span className="text-xs font-bold text-[#8b94a1]">Loading tasks...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : mappedTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-xs font-bold text-[#8b94a1]">
                No tasks found.
              </TableCell>
            </TableRow>
          ) : (
            mappedTasks.map((task) => (
              <TableRow
                className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] hover:border-l-[#FFD369] hover:bg-[#202832]"
                key={task.id}
              >
                <TableCell className="px-5">
                  <div>
                    <p className="text-sm font-black leading-5 text-white">{task.title}</p>
                    <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
                      {task.file} <span className="text-[#5b626d]">-</span> {task.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-bold text-white">{task.project}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="grid size-7 place-items-center rounded-full border border-[#121820] text-[9px] font-black text-white"
                      style={{ backgroundColor: task.assignee.color }}
                    >
                      {task.assignee.initials}
                    </span>
                    <span className="text-xs font-bold text-white">{task.assignee.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`h-7 rounded-full border px-3 text-[11px] font-bold ${taskStatusClassName[task.status]}`}
                    variant="outline"
                  >
                    {formatStatus(task.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-bold text-white">{task.due}</TableCell>
                <TableCell className="text-xs font-bold text-white">{task.updated}</TableCell>
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
