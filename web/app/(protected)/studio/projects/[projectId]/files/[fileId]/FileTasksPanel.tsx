'use client';

import { useState } from 'react';
import { Circle, CircleCheck, Crosshair, FileText, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/hooks/useAuth';
import { fileStatusClassName, fileStatusLabels, type FileTaskItem } from '../file-ui';

type TaskFilter = 'ALL' | 'MINE' | 'REVIEW';

type FileTasksPanelProps = {
  annotationMode: boolean;
  canCreateTask: boolean;
  onCreateTask: () => void;
  onSelectTask: (taskId: string | null) => void;
  selectedTaskId: string | null;
  tasks: FileTaskItem[];
};

export function FileTasksPanel({
  annotationMode,
  canCreateTask,
  onCreateTask,
  onSelectTask,
  selectedTaskId,
  tasks,
}: FileTasksPanelProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const visibleTasks = tasks.filter(
    (task) =>
      filter === 'ALL' ||
      (filter === 'MINE' && user?.id != null && task.assignedToUserId === user.id) ||
      (filter === 'REVIEW' && task.status === 'REVIEW'),
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.08em] text-white">Tasks</h2>
          <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">{tasks.length} linked</p>
        </div>
        {canCreateTask ? (
          <Button
            aria-label="Create task"
            className="size-8 bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            onClick={onCreateTask}
            size="icon"
          >
            <Plus className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1 rounded-[4px] bg-[#101820] p-1">
        {(['ALL', 'MINE', 'REVIEW'] as const).map((value) => (
          <button
            className={`flex-1 rounded-[3px] py-1 text-[9px] font-black uppercase transition-colors ${
              filter === value ? 'bg-[#202832] text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
            }`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {value === 'MINE' ? 'My' : value[0] + value.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {annotationMode ? (
        <p className="mt-3 border border-[#6c5516] bg-[#30270d] px-3 py-2 text-[10px] font-bold leading-4 text-[#ffd35b]">
          Drag a rectangle on the canvas to define the task region.
        </p>
      ) : null}

      <div className="mt-3 space-y-2 pr-1">
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <button
              className={`w-full rounded-[4px] border p-3 text-left transition-colors ${
                selectedTaskId === task.id
                  ? 'border-[#FFD369] bg-[#16202b]'
                  : 'border-[#303842] bg-[#151c25] hover:border-[#4b535f] hover:bg-[#1b2530]'
              }`}
              key={task.id}
              onClick={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {task.status === 'DONE' ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#9df2c7]" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-[#FFD369]" />
                  )}
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-black text-white">{task.title}</span>
                    <span className="mt-1 block truncate text-[10px] font-bold text-[#8b94a1]">
                      {task.assignedTo}
                    </span>
                    <span className="mt-1 block truncate text-[9px] font-bold text-[#8b94a1]">
                      Due {task.dueDate ?? 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge className={`rounded-[3px] border text-[9px] ${fileStatusClassName[task.status]}`}>
                    {fileStatusLabels[task.status]}
                  </Badge>
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b94a1]">
                    {task.region ? <Crosshair className="size-3" /> : <FileText className="size-3" />}
                    {task.region ? 'Region' : 'Whole'}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="border border-[#303842] bg-[#151c25] px-3 py-5 text-center text-[10px] font-bold text-[#8b94a1]">
            No tasks match this filter.
          </p>
        )}
      </div>
    </section>
  );
}
