'use client';

import { useState } from 'react';
import { Circle, CircleCheck, Crosshair, FileText, Plus, Edit3, Trash2 } from 'lucide-react';

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
  onEditTask?: (task: FileTaskItem) => void;
  onDeleteTask?: (task: FileTaskItem) => void;
  canEditTask?: (task: FileTaskItem) => boolean;
  canDeleteTask?: (task: FileTaskItem) => boolean;
  selectedTaskId: string | null;
  tasks: FileTaskItem[];
};

export function FileTasksPanel({
  annotationMode,
  canCreateTask,
  onCreateTask,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  canEditTask,
  canDeleteTask,
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



      <div className="mt-3 space-y-2 pr-1">
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <div
              className={`w-full rounded-[4px] border p-3 text-left transition-colors cursor-pointer ${
                selectedTaskId === task.id
                  ? 'border-[#FFD369] bg-[#16202b]'
                  : 'border-[#303842] bg-[#151c25] hover:border-[#4b535f] hover:bg-[#1b2530]'
              }`}
              key={task.id}
              onClick={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTask(selectedTaskId === task.id ? null : task.id);
                }
              }}
              role="button"
              tabIndex={0}
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
                      {task.assignedTo || 'Unassigned'}
                    </span>
                    <span className="mt-1 block truncate text-[9px] font-bold text-[#8b94a1]">
                      Due {task.dueDate ?? ''}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge className={`rounded-[3px] border text-[9px] ${fileStatusClassName[task.status]}`}>
                    {fileStatusLabels[task.status]}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {onEditTask && canEditTask?.(task) !== false && (
                      <button
                        type="button"
                        className="p-1 rounded text-[#8b94a1] hover:text-white hover:bg-[#202832] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        title="Edit Task"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                    )}
                    {onDeleteTask && canDeleteTask?.(task) !== false && (
                      <button
                        type="button"
                        className="p-1 rounded text-[#8b94a1] hover:text-red-400 hover:bg-[#451a1a] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task);
                        }}
                        title="Delete Task"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
