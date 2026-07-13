'use client';

import { useState } from 'react';
import { Crosshair, FileText, Check, X, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  taskPriorityClassName,
  taskStatusClassName,
  taskStatusLabels,
  type TaskStatus,
  type TaskWorkspaceItem,
} from './task-ui';

// ─── Types ───────────────────────────────────────────────────────────────────

type PendingDrop = {
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
};

type ModalKind = 'submit-review' | 'request-revision' | 'approve' | null;

type TaskKanbanProps = {
  canReview: (task: TaskWorkspaceItem) => boolean;
  onOpenTask: (task: TaskWorkspaceItem) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus, comment?: string) => Promise<void>;
  tasks: TaskWorkspaceItem[];
};

// ─── Kanban Card (pure display) ───────────────────────────────────────────────

function KanbanCard({
  task,
  onOpenTask,
  isDragOverlay = false,
  dragHandleProps,
}: {
  task: TaskWorkspaceItem;
  onOpenTask?: (task: TaskWorkspaceItem) => void;
  isDragOverlay?: boolean;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <div
      className={`w-full rounded-[4px] border border-[#39424f] bg-[#151c25] p-3 select-none
        ${isDragOverlay
          ? 'shadow-[0_8px_32px_rgba(0,0,0,0.7)] ring-2 ring-[#FFD369]/50 rotate-1'
          : 'cursor-grab active:cursor-grabbing'}
      `}
      {...(isDragOverlay ? {} : dragHandleProps)}
    >
      <div className="flex items-start gap-2">
        {task.region ? (
          <Crosshair className="mt-0.5 size-4 shrink-0 text-[#FFD369]" />
        ) : (
          <FileText className="mt-0.5 size-4 shrink-0 text-[#aeb7c2]" />
        )}
        <span className="line-clamp-2 text-xs font-black leading-5 text-white">{task.title}</span>
      </div>
      <p className="mt-2 truncate text-[10px] font-bold text-[#8b94a1]">{task.fileTitle}</p>
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
      {onOpenTask && !isDragOverlay && (
        <button
          className="mt-2 w-full rounded-[3px] border border-[#39424f] bg-[#0d151e] py-1 text-[9px] font-black text-[#8b94a1] transition hover:border-[#FFD369]/40 hover:text-[#FFD369]"
          onClick={(e) => {
            e.stopPropagation();
            onOpenTask(task);
          }}
          type="button"
        >
          Open Task →
        </button>
      )}
    </div>
  );
}

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({
  task,
  isDragging,
  onOpenTask,
}: {
  task: TaskWorkspaceItem;
  isDragging: boolean;
  onOpenTask: (task: TaskWorkspaceItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-30' : ''}>
      <KanbanCard
        task={task}
        onOpenTask={onOpenTask}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  tasks,
  isOver,
  isDisabled,
  onOpenTask,
  activeId,
  isDragging,
}: {
  status: TaskStatus;
  tasks: TaskWorkspaceItem[];
  isOver: boolean;
  isDisabled: boolean;
  onOpenTask: (task: TaskWorkspaceItem) => void;
  activeId: string | null;
  isDragging: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status, disabled: isDisabled });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[420px] rounded-[5px] border transition-colors duration-150
        ${isOver && !isDisabled ? 'border-[#FFD369] bg-[#1b2530]' : 'border-[#303842] bg-[#0d151e]'}
        ${isDisabled && isDragging ? 'opacity-40' : ''}
      `}
    >
      <header className="flex h-10 items-center justify-between border-b border-[#303842] px-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.08em] text-white">
          {taskStatusLabels[status]}
        </h2>
        <span className="grid size-5 place-items-center rounded-[3px] bg-[#303842] text-[10px] font-black text-[#FFD369]">
          {tasks.length}
        </span>
      </header>
      <div className="space-y-2 p-2">
        {tasks.length ? (
          tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              isDragging={activeId === task.id}
              onOpenTask={onOpenTask}
            />
          ))
        ) : (
          <p
            className={`rounded-[4px] border border-dashed px-3 py-6 text-center text-xs font-bold transition-colors duration-150
              ${isOver && !isDisabled ? 'border-[#FFD369]/40 text-[#FFD369]/60' : 'border-[#303842] text-[#8b94a1]'}
            `}
          >
            {isOver && !isDisabled ? 'Drop here' : 'No tasks'}
          </p>
        )}
      </div>
      {isDisabled && isDragging && (
        <p className="px-3 pb-3 text-center text-[9px] font-bold text-[#5b626d]">
          Reviewer permission required
        </p>
      )}
    </section>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function SubmitReviewModal({
  open,
  taskTitle,
  isLoading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  taskTitle: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-[#6c5516] bg-[#30270d] text-[#FFD369]">
            <Check className="size-5" />
          </div>
          <DialogTitle className="text-lg font-black text-white">Submit for Review?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#aeb7c2]">
            <span className="font-bold text-white">"{taskTitle}"</span> will be moved to the review
            queue. Make sure all files are uploaded before submitting.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-[#39424f] bg-[#151c25] px-6 py-4">
          <Button
            className="h-9 border-[#39424f] bg-[#101820] text-xs font-black text-white hover:bg-[#222831]"
            disabled={isLoading}
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="h-9 bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Submit for Review →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestRevisionModal({
  open,
  taskTitle,
  isLoading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  taskTitle: string;
  isLoading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-[#6b2637] bg-[#371522] text-[#ff9ab3]">
            <X className="size-5" />
          </div>
          <DialogTitle className="text-lg font-black text-white">Request Revision</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#aeb7c2]">
            Explain what needs to be changed in{' '}
            <span className="font-bold text-white">"{taskTitle}"</span>. This will be posted as a
            comment on the task.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <textarea
            autoFocus
            className="h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] p-3 text-xs font-medium text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]"
            disabled={isLoading}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what needs to be revised..."
            value={reason}
          />
        </div>
        <DialogFooter className="gap-2 border-t border-[#39424f] bg-[#151c25] px-6 py-4">
          <Button
            className="h-9 border-[#39424f] bg-[#101820] text-xs font-black text-white hover:bg-[#222831]"
            disabled={isLoading}
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="h-9 border border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
            disabled={isLoading || !reason.trim()}
            onClick={handleConfirm}
            variant="outline"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : '↩ Send Back'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApproveModal({
  open,
  taskTitle,
  isLoading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  taskTitle: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-[#315846] bg-[#14291f] text-[#9df2c7]">
            <Check className="size-5" />
          </div>
          <DialogTitle className="text-lg font-black text-white">Approve & Complete?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#aeb7c2]">
            <span className="font-bold text-white">"{taskTitle}"</span> will be marked as Done.
            This confirms the work has been reviewed and accepted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-[#39424f] bg-[#151c25] px-6 py-4">
          <Button
            className="h-9 border-[#39424f] bg-[#101820] text-xs font-black text-white hover:bg-[#222831]"
            disabled={isLoading}
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="h-9 bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : '✓ Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const COLUMNS: TaskStatus[] = ['PENDING', 'INPROGRESS', 'REVIEW', 'DONE'];

export function TaskKanban({ canReview, onOpenTask, onStatusChange, tasks }: TaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;
  const isDragging = activeId !== null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const isColumnDisabled = (status: TaskStatus): boolean => {
    if (!isDragging || !activeTask) return false;
    const userCanReview = canReview(activeTask);
    if (status === 'DONE' && !userCanReview) return true;
    if (status === 'INPROGRESS' && activeTask.status === 'REVIEW' && !userCanReview) return true;
    return false;
  };

  const getModalKind = (from: TaskStatus, to: TaskStatus): ModalKind => {
    if (to === 'REVIEW') return 'submit-review';
    if (to === 'INPROGRESS' && from === 'REVIEW') return 'request-revision';
    if (to === 'DONE') return 'approve';
    return null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverColumnId(over ? (String(over.id) as TaskStatus) : null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverColumnId(null);
    if (!over) return;

    const task = tasks.find((t) => t.id === String(active.id));
    const newStatus = String(over.id) as TaskStatus;
    if (!task || task.status === newStatus) return;
    if (isColumnDisabled(newStatus)) return;

    const kind = getModalKind(task.status, newStatus);
    const drop: PendingDrop = { taskId: task.id, fromStatus: task.status, toStatus: newStatus };
    setPendingDrop(drop);

    if (kind) {
      setModalKind(kind);
    } else {
      // No confirmation needed — apply directly
      void onStatusChange(task.id, newStatus);
      setPendingDrop(null);
    }
  };

  const handleModalConfirm = async (comment?: string) => {
    if (!pendingDrop) return;
    setIsModalLoading(true);
    try {
      await onStatusChange(pendingDrop.taskId, pendingDrop.toStatus, comment);
    } finally {
      setIsModalLoading(false);
      setModalKind(null);
      setPendingDrop(null);
    }
  };

  const handleModalCancel = () => {
    setModalKind(null);
    setPendingDrop(null);
  };

  const pendingTask = pendingDrop ? tasks.find((t) => t.id === pendingDrop.taskId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid w-full min-w-0 grid-cols-4 gap-3">
          {COLUMNS.map((status) => (
            <DroppableColumn
              key={status}
              activeId={activeId}
              isDragging={isDragging}
              isDisabled={isColumnDisabled(status)}
              isOver={overColumnId === status}
              onOpenTask={onOpenTask}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <KanbanCard isDragOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <SubmitReviewModal
        isLoading={isModalLoading}
        onCancel={handleModalCancel}
        onConfirm={() => void handleModalConfirm()}
        open={modalKind === 'submit-review'}
        taskTitle={pendingTask?.title ?? ''}
      />
      <RequestRevisionModal
        isLoading={isModalLoading}
        onCancel={handleModalCancel}
        onConfirm={(reason) => void handleModalConfirm(reason)}
        open={modalKind === 'request-revision'}
        taskTitle={pendingTask?.title ?? ''}
      />
      <ApproveModal
        isLoading={isModalLoading}
        onCancel={handleModalCancel}
        onConfirm={() => void handleModalConfirm()}
        open={modalKind === 'approve'}
        taskTitle={pendingTask?.title ?? ''}
      />
    </>
  );
}
