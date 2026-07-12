'use client';

import { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileTasksPanel } from '../FileTasksPanel';
import { TaskActionDialogs, DeleteTaskDialog } from './TaskActionDialogs';
import { MaterialTabDetail } from './MaterialTabDetail';
import { TaskDetailPanel } from './TaskDetailPanel';
import type { MobileTaskDrawerProps } from './types';
import type { FileTaskItem } from '../../file-ui';

export function MobileTaskDrawer({
  annotationMode,
  canCreateTask,
  canReviewTask,
  canSubmitTask,
  file,
  focusedTask,
  onClose,
  onCloseFocusedTask,
  onCreateTask,
  onSelectTask,
  onStartFrameComment,
  onSubmitTaskWork,
  onMarkReadyForReview,
  onTaskChange,
  open,
  selectedSubmissionId,
  selectedTaskId,
  tasks,
  versions,
  discussionContextKey,
  setDiscussionContext,
  commentFilterMode,
  setCommentFilterMode,
  members,
  onRefresh,
  discussionFrameComments,
}: MobileTaskDrawerProps) {
  const [sidebarTab, setSidebarTab] = useState<'task' | 'material'>('task');
  const [mobileEditingTask, setMobileEditingTask] = useState<FileTaskItem | null>(null);
  const [mobileDeletingTask, setMobileDeletingTask] = useState<FileTaskItem | null>(null);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 lg:hidden">
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#26303b] bg-[#0d151e]">
        <div className="flex items-center justify-between border-b border-[#26303b] p-4 shrink-0">
          <span className="text-xs font-black uppercase text-white">Tasks</span>
          <Button className="size-8" onClick={onClose} size="icon" variant="ghost">
            <X className="size-4 text-[#8b94a1]" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="shrink-0 border-b border-[#26303b] p-4 max-h-[220px] overflow-y-auto">
            <FileTasksPanel
              annotationMode={annotationMode}
              canCreateTask={canCreateTask}
              onCreateTask={onCreateTask}
              onSelectTask={onSelectTask}
              onEditTask={setMobileEditingTask}
              onDeleteTask={setMobileDeletingTask}
              selectedTaskId={selectedTaskId}
              tasks={tasks}
            />
            {mobileEditingTask && (
              <TaskActionDialogs
                task={mobileEditingTask}
                onClose={() => setMobileEditingTask(null)}
                onRefresh={onRefresh}
                members={members}
              />
            )}
            {mobileDeletingTask && (
              <DeleteTaskDialog
                task={mobileDeletingTask}
                onClose={() => setMobileDeletingTask(null)}
                onRefresh={onRefresh}
              />
            )}
          </section>

          <div className="flex h-11 shrink-0 items-center border-b border-[#26303b] bg-[#091018] px-4">
            <button
              className={`relative h-full px-4 text-xs font-black capitalize ${
                sidebarTab === 'material' ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
              }`}
              onClick={() => setSidebarTab('material')}
            >
              Material
              {sidebarTab === 'material' && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FFD369]" />
              )}
            </button>
            <button
              className={`relative h-full px-4 text-xs font-black capitalize ${
                sidebarTab === 'task' ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
              }`}
              onClick={() => setSidebarTab('task')}
            >
              Task
              {sidebarTab === 'task' && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FFD369]" />
              )}
            </button>
          </div>

          <section className="flex-1 overflow-y-auto bg-[#101820]">
            {sidebarTab === 'material' ? (
              <MaterialTabDetail versions={versions} focusedTask={focusedTask} fileId={file.id} onRefresh={onRefresh} />
            ) : (
              <div className="p-4">
                <TaskDetailPanel
                  canReviewTask={canReviewTask}
                  canSubmitTask={canSubmitTask}
                  focusedTask={focusedTask}
                  onCloseFocusedTask={onCloseFocusedTask}
                  onStartFrameComment={onStartFrameComment}
                  onSubmitTaskWork={onSubmitTaskWork}
                  onMarkReadyForReview={onMarkReadyForReview}
                  onTaskChange={onTaskChange}
                  selectedSubmissionId={selectedSubmissionId}
                  versions={versions}
                  members={members}
                  onRefresh={onRefresh}
                  discussionContextKey={discussionContextKey}
                  setDiscussionContext={setDiscussionContext}
                  commentFilterMode={commentFilterMode}
                  setCommentFilterMode={setCommentFilterMode}
                  discussionFrameComments={discussionFrameComments}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export function ExpandTaskSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="absolute right-2 top-1/2 z-40 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all hover:bg-[#eac04f] lg:grid"
      onClick={onClick}
      title="Expand Sidebar"
      type="button"
    >
      <ChevronLeft className="size-4" />
    </button>
  );
}
