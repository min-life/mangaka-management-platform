'use client';

import { Crosshair, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import {
  taskPriorityClassName,
  taskStatusClassName,
  taskStatusLabels,
  type TaskWorkspaceItem,
} from './task-ui';

type TaskTableProps = { onOpenTask: (task: TaskWorkspaceItem) => void; tasks: TaskWorkspaceItem[] };

export function TaskTable({ onOpenTask, tasks }: TaskTableProps) {
  return (
    <div className="overflow-x-auto rounded-[5px] border border-[#303842]">
      <div className="grid min-w-[900px] grid-cols-[minmax(260px,1fr)_190px_150px_100px_120px_130px] bg-[#222a34] px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
        <span>Task</span><span>Related File</span><span>Assignee</span><span>Priority</span><span>Status</span><span>Due Date</span>
      </div>
      {tasks.length ? tasks.map((task) => (
        <button className="grid min-h-16 w-full min-w-[900px] grid-cols-[minmax(260px,1fr)_190px_150px_100px_120px_130px] items-center border-t border-[#303842] bg-[#151c25] px-4 text-left hover:bg-[#1b2530]" key={task.id} onClick={() => onOpenTask(task)} type="button">
          <span className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-[#FFD369]">{task.region ? <Crosshair className="size-4" /> : <FileText className="size-4" />}</span><span className="min-w-0"><span className="block truncate text-xs font-black text-white">{task.title}</span><span className="mt-1 block text-[10px] font-bold text-[#8b94a1]">Updated {task.updatedAt}</span></span></span>
          <span className="truncate text-xs font-bold text-[#dce7f3]">{task.fileTitle}</span>
          <span className="truncate text-xs font-bold text-white">{task.assignee}</span>
          <Badge className={`w-fit rounded-[3px] border ${taskPriorityClassName[task.priority]}`}>{task.priority}</Badge>
          <Badge className={`w-fit rounded-[3px] border ${taskStatusClassName[task.status]}`}>{taskStatusLabels[task.status]}</Badge>
          <span className="text-xs font-bold text-[#aeb7c2]">{task.dueDate}</span>
        </button>
      )) : <p className="bg-[#151c25] px-4 py-8 text-center text-xs font-bold text-[#8b94a1]">No tasks found.</p>}
    </div>
  );
}
