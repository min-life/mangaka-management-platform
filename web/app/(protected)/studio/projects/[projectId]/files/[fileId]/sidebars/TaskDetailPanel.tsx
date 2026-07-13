'use client';

import { FocusedTaskWorkspace } from '../FocusedTaskWorkspace';
import { getTargetVersion } from './utils';
import type { FileTaskSidebarProps } from './types';

export function EmptyTaskDetail() {
  return (
    <section className="grid min-h-[200px] place-items-center bg-[#101820]/30 p-4 text-center">
      <p className="text-xs font-bold text-[#8b94a1]">
        Select a task from the list above to view details, submit updates, or review actions.
      </p>
    </section>
  );
}

export function TaskDetailPanel({
  canReviewTask,
  canSubmitTask,
  focusedTask,
  onCloseFocusedTask,
  onStartFrameComment,
  onSubmitTaskWork,
  onMarkReadyForReview,
  onTaskChange,
  versions,
  members,
  onRefresh,
  discussionContextKey,
  setDiscussionContext,
  commentFilterMode,
  setCommentFilterMode,
  discussionFrameComments,
}: Pick<
  FileTaskSidebarProps,
  | 'canReviewTask'
  | 'canSubmitTask'
  | 'focusedTask'
  | 'onCloseFocusedTask'
  | 'onStartFrameComment'
  | 'onSubmitTaskWork'
  | 'onMarkReadyForReview'
  | 'onTaskChange'
  | 'versions'
  | 'members'
  | 'onRefresh'
  | 'discussionContextKey'
  | 'setDiscussionContext'
  | 'commentFilterMode'
  | 'setCommentFilterMode'
  | 'discussionFrameComments'
>) {
  if (!focusedTask) {
    return <EmptyTaskDetail />;
  }

  return (
    <FocusedTaskWorkspace
      canReview={canReviewTask}
      canSubmit={canSubmitTask}
      onClose={onCloseFocusedTask}
      onStartFrameComment={onStartFrameComment}
      onSubmitWork={onSubmitTaskWork}
      onMarkReadyForReview={onMarkReadyForReview}
      onTaskChange={onTaskChange}
      task={focusedTask}
      targetVersion={getTargetVersion(focusedTask, versions)}
      members={members}
      onRefresh={onRefresh}
      commentFilterMode={commentFilterMode}
      setCommentFilterMode={setCommentFilterMode}
      discussionFrameComments={discussionFrameComments}
    />
  );
}
