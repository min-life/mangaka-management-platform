'use client';

import { Crosshair, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { taskPriorityClassName, taskStatusClassName, taskStatusLabels, type TaskWorkspaceItem } from './task-ui';

type TaskKanbanProps = { onOpenTask: (task: TaskWorkspaceItem) => void; tasks: TaskWorkspaceItem[] };

export function TaskKanban({ onOpenTask, tasks }: TaskKanbanProps) {
  return (
    <div className="grid min-w-[1120px] grid-cols-4 gap-3 2xl:min-w-0">
      {(['PENDING', 'INPROGRESS', 'REVIEW', 'DONE'] as const).map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section
            className="min-h-[420px] rounded-[5px] border border-[#303842] bg-[#0d151e]"
            key={status}
          >
            <header className="flex h-10 items-center justify-between border-b border-[#303842] px-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.08em] text-white">
                {taskStatusLabels[status]}
              </h2>
              <span className="grid size-5 place-items-center rounded-[3px] bg-[#303842] text-[10px] font-black text-[#FFD369]">
                {columnTasks.length}
              </span>
            </header>
            <div className="space-y-2 p-2">
              {columnTasks.length ? (
                columnTasks.map((task) => (
                  <button
                    className="w-full rounded-[4px] border border-[#39424f] bg-[#151c25] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#FFD369]/60 hover:bg-[#1b2530]"
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    type="button"
                  >
                    <div className="flex items-start gap-2">
                      {task.region ? (
                        <Crosshair className="mt-0.5 size-4 shrink-0 text-[#FFD369]" />
                      ) : (
                        <FileText className="mt-0.5 size-4 shrink-0 text-[#aeb7c2]" />
                      )}
                      <span className="line-clamp-2 text-xs font-black leading-5 text-white">
                        {task.title}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-[10px] font-bold text-[#8b94a1]">
                      {task.fileTitle}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className={`rounded-[3px] border ${taskPriorityClassName[task.priority]}`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`rounded-[3px] border ${taskStatusClassName[task.status]}`}>
                        {taskStatusLabels[task.status]}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold text-[#aeb7c2]">
                      <span className="truncate">{task.assignee}</span>
                      <span className="shrink-0">{task.dueDate}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="rounded-[4px] border border-dashed border-[#303842] px-3 py-6 text-center text-xs font-bold text-[#8b94a1]">
                  No tasks
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
