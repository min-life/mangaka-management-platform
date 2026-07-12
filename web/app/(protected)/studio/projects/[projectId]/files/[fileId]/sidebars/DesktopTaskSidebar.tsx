'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { FileTasksPanel } from '../FileTasksPanel';
import { TaskActionDialogs, DeleteTaskDialog } from './TaskActionDialogs';
import { MaterialTabDetail } from './MaterialTabDetail';
import { TaskDetailPanel } from './TaskDetailPanel';
import { getVersionFooter } from './utils';
import type { DesktopTaskSidebarProps } from './types';
import type { FileTaskItem } from '../../file-ui';

export function DesktopTaskSidebar({
  annotationMode,
  canCreateTask,
  canReviewTask,
  canSubmitTask,
  file,
  focusedTask,
  isOpen,
  onClose,
  onCloseFocusedTask,
  onCreateTask,
  onSelectTask,
  onStartFrameComment,
  onSubmitTaskWork,
  onMarkReadyForReview,
  onTaskChange,
  selectedSubmissionId,
  selectedTaskId,
  selectedVersion,
  tasks,
  versions,
  members,
  onRefresh,
  discussionContextKey,
  setDiscussionContext,
  commentFilterMode,
  setCommentFilterMode,
  discussionFrameComments,
}: DesktopTaskSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'task' | 'material'>('task');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [topSectionHeight, setTopSectionHeight] = useState(220);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [editingTask, setEditingTask] = useState<FileTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<FileTaskItem | null>(null);
  const topSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Width is computed from the right edge of the window
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= 280 && newWidth <= 800) {
          setSidebarWidth(newWidth);
        }
      } else if (isResizingVertical && topSectionRef.current) {
        const rect = topSectionRef.current.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        if (newHeight >= 100 && newHeight <= 800) {
          setTopSectionHeight(newHeight);
        }
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingVertical(false);
    };

    if (isResizing || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing, isResizingVertical]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside 
      className="relative hidden h-full shrink-0 flex-col overflow-visible border-l border-[#26303b] bg-[#0d151e] lg:flex"
      style={{ width: sidebarWidth }}
    >
      {/* Resizer Handle */}
      <div 
        className="absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-[#FFD369]/20 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
      
      <button
        className="absolute left-0 top-1/2 z-40 hidden size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all hover:bg-[#eac04f] lg:grid"
        onClick={onClose}
        title="Collapse Sidebar"
        type="button"
      >
        <ChevronRight className="size-4" />
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        <section 
          ref={topSectionRef}
          className="shrink-0 p-4 overflow-y-auto"
          style={{ height: topSectionHeight }}
        >
          <FileTasksPanel
            annotationMode={annotationMode}
            canCreateTask={canCreateTask}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            onEditTask={setEditingTask}
            onDeleteTask={setDeletingTask}
            selectedTaskId={selectedTaskId}
            tasks={tasks}
          />
          {editingTask && (
            <TaskActionDialogs
              task={editingTask}
              onClose={() => setEditingTask(null)}
              onRefresh={onRefresh}
              members={members}
            />
          )}
          {deletingTask && (
            <DeleteTaskDialog
              task={deletingTask}
              onClose={() => setDeletingTask(null)}
              onRefresh={onRefresh}
            />
          )}
        </section>

        {/* Vertical Resizer Handle */}
        <div 
          className="relative h-1 cursor-row-resize bg-[#26303b] z-40 hover:bg-[#FFD369] transition-colors shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingVertical(true);
          }}
        />

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

      <div className="mt-auto shrink-0 border-t border-[#26303b] bg-[#151c25]/10 py-3 text-center">
        <p className="text-[10px] font-bold text-[#8b94a1]">
          {getVersionFooter(selectedVersion, versions)}
        </p>
      </div>
    </aside>
  );
}
