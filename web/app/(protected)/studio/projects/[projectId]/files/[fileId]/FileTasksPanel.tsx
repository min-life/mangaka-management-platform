'use client';

import { useState } from 'react';
import { Circle, CircleCheck, Crosshair, FileText, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { fileStatusClassName, fileStatusLabels, type FileTaskItem } from '../file-ui';

type TaskFilter = 'ALL' | 'MINE' | 'REVIEW';

type FileTasksPanelProps = {
  annotationMode: boolean;
  canCreateTask: boolean;
  onCreateWholeTask: () => void;
  onSelectTask: (taskId: string | null) => void;
  onStartAnnotation: () => void;
  selectedTaskId: string | null;
  tasks: FileTaskItem[];
};

export function FileTasksPanel({
  annotationMode,
  canCreateTask,
  onCreateWholeTask,
  onSelectTask,
  onStartAnnotation,
  selectedTaskId,
  tasks,
}: FileTasksPanelProps) {
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const visibleTasks = tasks.filter(
    (task) =>
      filter === 'ALL' ||
      (filter === 'MINE' && /current|sarah/i.test(task.assignedTo)) ||
      (filter === 'REVIEW' && task.status === 'REVIEW'),
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.08em] text-white">Tasks</h2>
          <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">{tasks.length} linked tasks *</p>
        </div>
        {canCreateTask ? (
          <Button
            aria-label="Create task"
            className="size-8 bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            onClick={() => setScopeDialogOpen(true)}
            size="icon"
          >
            <Plus className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1 border-b border-[#303842]">
        {(['ALL', 'MINE', 'REVIEW'] as const).map((value) => (
          <button
            className={`relative h-8 px-2 text-[9px] font-black uppercase ${
              filter === value ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
            }`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {value === 'MINE' ? 'My' : value[0] + value.slice(1).toLowerCase()}
            {filter === value ? <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#FFD369]" /> : null}
          </button>
        ))}
      </div>

      {annotationMode ? (
        <p className="mt-3 border border-[#6c5516] bg-[#30270d] px-3 py-2 text-[10px] font-bold leading-4 text-[#ffd35b]">
          Drag a rectangle on the canvas to define the task region.
        </p>
      ) : null}

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <button
              className={`w-full border p-3 text-left transition-colors ${
                selectedTaskId === task.id
                  ? 'border-[#FFD369] bg-[#26303b]'
                  : 'border-[#303842] bg-[#151c25] hover:border-[#4b535f] hover:bg-[#1b2530]'
              }`}
              key={task.id}
              onClick={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
              type="button"
            >
              <div className="flex items-start gap-2">
                {task.status === 'DONE' ? (
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#9df2c7]" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-[#FFD369]" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-white">{task.title}</span>
                  <span className="mt-1 block truncate text-[10px] font-bold text-[#8b94a1]">
                    {task.assignedTo}
                  </span>
                  <span className="mt-1 block truncate text-[9px] font-bold text-[#8b94a1]">
                    Due {task.dueDate ?? 'Not set *'}
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 pl-6">
                <Badge className={`rounded-[3px] border text-[9px] ${fileStatusClassName[task.status]}`}>
                  {fileStatusLabels[task.status]}
                </Badge>
                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b94a1]">
                  {task.region ? <Crosshair className="size-3" /> : <FileText className="size-3" />}
                  {task.region ? 'Region' : 'Whole File'}
                </span>
              </div>
            </button>
          ))
        ) : (
          <p className="border border-[#303842] bg-[#151c25] px-3 py-5 text-center text-[10px] font-bold text-[#8b94a1]">
            No tasks match this filter.
          </p>
        )}
      </div>

      <Dialog onOpenChange={setScopeDialogOpen} open={scopeDialogOpen}>
        <DialogContent className="max-w-md border-[#39424f] bg-[#101820] text-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white">Choose Task Scope</DialogTitle>
            <DialogDescription className="text-sm text-[#aeb7c2]">
              Assign work to the whole file or a precise canvas region. *
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="border border-[#39424f] bg-[#151c25] p-4 text-left hover:border-[#FFD369]"
              onClick={() => {
                setScopeDialogOpen(false);
                onCreateWholeTask();
              }}
              type="button"
            >
              <FileText className="size-5 text-[#FFD369]" />
              <span className="mt-3 block text-xs font-black text-white">Whole File</span>
              <span className="mt-1 block text-[10px] leading-4 text-[#8b94a1]">Proofreading, lettering, cover design, or full-page work.</span>
            </button>
            <button
              className="border border-[#39424f] bg-[#151c25] p-4 text-left hover:border-[#FFD369]"
              onClick={() => {
                setScopeDialogOpen(false);
                onStartAnnotation();
              }}
              type="button"
            >
              <Crosshair className="size-5 text-[#FFD369]" />
              <span className="mt-3 block text-xs font-black text-white">Selected Region</span>
              <span className="mt-1 block text-[10px] leading-4 text-[#8b94a1]">Character, background, panel, or local correction.</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
