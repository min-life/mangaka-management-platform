'use client';

import { Crosshair, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import {
  taskStatusClassName,
  taskStatusLabels,
  type TaskWorkspaceItem,
} from './task-ui';

type TaskTableProps = { onOpenTask: (task: TaskWorkspaceItem) => void; tasks: TaskWorkspaceItem[] };

export function TaskTable({ onOpenTask, tasks }: TaskTableProps) {
  return (
    <div className="w-full rounded-[5px] border border-[#303842]">
      <div className="hidden w-full lg:block">
        <div className="grid w-full grid-cols-[minmax(180px,2fr)_minmax(80px,1fr)_minmax(120px,1.2fr)_100px_90px_110px] gap-x-4 bg-[#242d37] px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
          <span>Task</span>
          <span>Related File</span>
          <span>Assignee</span>
          <span>Update Day</span>
          <span>Status</span>
          <span>Due</span>
        </div>
        {tasks.length ? (
          tasks.map((task) => (
            <button
              className="grid min-h-[72px] w-full grid-cols-[minmax(180px,2fr)_minmax(80px,1fr)_minmax(120px,1.2fr)_100px_90px_110px] gap-x-4 items-center border-t border-[#303842] bg-[#151c25] px-4 text-left transition hover:border-[#FFD369]/40 hover:bg-[#1b2530]"
              key={task.id}
              onClick={() => onOpenTask(task)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-[#FFD369]">
                  {task.region ? <Crosshair className="size-4" /> : <FileText className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{task.title}</span>
                  <span className="mt-1 block truncate text-[10px] font-bold text-[#8b94a1]">
                    Updated {task.updatedAt}
                  </span>
                </span>
              </span>
              <span className="truncate text-xs font-bold text-[#dce7f3]">{task.fileTitle}</span>
              <span className="truncate text-xs font-bold text-white">{task.assignee}</span>
              <span className="truncate text-xs font-bold text-[#aeb7c2]">
                {task.updatedAt}
              </span>
              <Badge className={`w-fit rounded-[3px] border ${taskStatusClassName[task.status]}`}>
                {taskStatusLabels[task.status]}
              </Badge>
              <span className="truncate text-xs font-bold text-[#aeb7c2]">{task.dueDate}</span>
            </button>
          ))
        ) : (
          <EmptyTasks />
        )}
      </div>

      <div className="space-y-2 p-3 lg:hidden">
        {tasks.length ? (
          tasks.map((task) => (
            <button
              className="w-full rounded-[5px] border border-[#303842] bg-[#151c25] p-3 text-left transition hover:border-[#FFD369]/50 hover:bg-[#1b2530]"
              key={task.id}
              onClick={() => onOpenTask(task)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-[#FFD369]">
                  {task.region ? <Crosshair className="size-4" /> : <FileText className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black leading-5 text-white">{task.title}</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-[#aeb7c2]">
                    {task.fileTitle} - {task.assignee}
                  </span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={`rounded-[3px] border ${taskStatusClassName[task.status]}`}>
                  {taskStatusLabels[task.status]}
                </Badge>
                <span className="text-[11px] font-bold text-[#8b94a1]">Updated {task.updatedAt}</span>
                <span className="text-[11px] font-bold text-[#8b94a1]">•</span>
                <span className="text-[11px] font-bold text-[#8b94a1]">{task.dueDate}</span>
              </div>
            </button>
          ))
        ) : (
          <EmptyTasks />
        )}
      </div>
    </div>
  );
}

function EmptyTasks() {
  return (
    <div className="bg-[#151c25] px-4 py-10 text-center">
      <FileText className="mx-auto size-8 text-[#4b535f]" />
      <p className="mt-3 text-sm font-black text-white">No tasks found</p>
      <p className="mt-1 text-xs font-bold text-[#8b94a1]">
        Try another filter or create the first production task.
      </p>
    </div>
  );
}
