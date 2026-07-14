'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { AlertTriangle, Check, ClipboardCheck, Crosshair, Edit3, FileUp, Trash2, UserRound, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { getCleanTaskDescription } from '@/lib/utils';
import { updateTask, deleteTask } from '@/services/task.service';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


import {
  taskStatusClassName,
  taskStatusLabels,
  type TaskWorkspaceItem,
} from '../../tasks/task-ui';
import { ReviewTaskDialog, type ReviewActionType } from '../../tasks/ReviewTaskDialog';
import { SubmitWorkDialog } from '../../tasks/[taskId]/SubmitWorkDialog';

type FocusedTaskWorkspaceProps = {
  canReview: boolean;
  canSubmit: boolean;
  onStartFrameComment: () => void;
  onClose?: () => void;
  onSubmitWork?: (input: {
    image?: File;
    text?: File;
    source?: File;
    note: string;
  }) => void;
  onMarkReadyForReview?: () => Promise<void>;
  onTaskChange: (task: TaskWorkspaceItem) => void;
  task: TaskWorkspaceItem;
  targetVersion?: string;
  members?: Array<{ id: number; name: string }>;
  onRefresh?: () => void | Promise<void>;
  commentFilterMode?: string;
  setCommentFilterMode?: (mode: 'all' | 'frame' | 'general') => void;
  discussionFrameComments?: any[];
};

export function FocusedTaskWorkspace({
  canReview,
  canSubmit,
  onClose,
  onStartFrameComment,
  onSubmitWork,
  onMarkReadyForReview,
  onTaskChange,
  task,
  targetVersion,
  members = [],
  onRefresh,
  commentFilterMode = 'all',
  setCommentFilterMode,
  discussionFrameComments = [],
}: FocusedTaskWorkspaceProps) {
  const [reviewAction, setReviewAction] = useState<ReviewActionType>(null);

  const frameDisplayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    discussionFrameComments.forEach(fc => {
      const fId = String(fc.frameId || fc.id);
      if (!map.has(fId)) {
        map.set(fId, map.size + 1);
      }
    });
    return map;
  }, [discussionFrameComments]);
  
  const handleReviewDirect = (approved: boolean, note: string) => {
    if (!task) return;
    const finalNote = note.trim() || (approved ? 'Looks good!' : '');
    
    let updatedDescription = task.description;
    const pendingSubmission = task.submissions.find(s => s.status === 'PENDING_REVIEW');
    if (pendingSubmission) {
      const originalNote = pendingSubmission.note.split('\nReviewer:')[0];
      const subNoteTag = `[Note: ${originalNote}]`;
      const reviewerTag = ` [Reviewer: ${finalNote}] [Result: ${approved ? 'APPROVED' : 'CHANGES_REQUESTED'}]`;
      if (task.description.includes(subNoteTag)) {
        updatedDescription = task.description.replace(subNoteTag, `${subNoteTag}${reviewerTag}`);
      } else {
        updatedDescription = `${task.description}\n${reviewerTag}`;
      }
    } else {
      // If there are no pending submissions, just append it directly
      const reviewerTag = `\n[Reviewer: ${finalNote}] [Result: ${approved ? 'APPROVED' : 'CHANGES_REQUESTED'}]`;
      updatedDescription = `${task.description}${reviewerTag}`;
    }

    onTaskChange({
      ...task,
      status: approved ? 'DONE' : 'INPROGRESS',
      description: updatedDescription,
      submissions: task.submissions.map((submission) => ({
        ...submission,
        status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
        note: `${submission.note}\nReviewer: ${finalNote}`,
      })),
      updatedAt: 'Just now',
    });
    setReviewAction(null);
  };

  return (
    <>
      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
            <ClipboardCheck className="size-4 text-[#FFD369]" /> Task Detail
          </h2>
          <div className="flex items-center gap-2">
            <Badge className={`rounded-[3px] border text-[9px] ${taskStatusClassName[task.status]}`}>
              {taskStatusLabels[task.status]}
            </Badge>

            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-[#8b94a1] hover:text-white"
                onClick={onClose}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      <div className="mt-3 border border-[#303842] bg-[#151c25] p-3">
        <p className="text-xs font-black text-white">{task.title}</p>
        <p className="mt-2 text-[10px] leading-4 text-[#dce7f3]">{getCleanTaskDescription(task.description)}</p>

        <p className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#8b94a1]">
          <UserRound className="size-3" /> {task.assignee || (task as any).assignedTo || 'Unassigned'}
          {task.dueDate ? ` · Due ${task.dueDate}` : ''}
        </p>
      </div>

      {canSubmit && task.status !== 'DONE' && task.status !== 'REVIEW' ? (
        task.parent && task.parent.status !== 'DONE' ? (
          <div className="mt-3 border border-[#6b2637] bg-[#371522] px-3 py-2 text-[10px] font-bold leading-4 text-[#ff9ab3] flex items-start gap-2 rounded-[4px]">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[#ff9ab3]" />
            <div>
              <p className="font-black">Submission Blocked</p>
              <p className="text-[#dce7f3] mt-0.5 font-medium">
                This task is a subtask of &ldquo;{task.parent.title}&rdquo; which is currently <strong>{task.parent.status}</strong>. The parent task must be completed (Done) first.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <SubmitWorkDialog onSubmit={onSubmitWork ?? (() => undefined)} />
            {onMarkReadyForReview && (
              <button
                className="w-full rounded-[3px] border border-[#FFD369]/30 bg-[#30270d] py-2 text-[10px] font-black text-[#FFD369] transition hover:border-[#FFD369]/60 hover:bg-[#3a3011]"
                onClick={onMarkReadyForReview}
                type="button"
              >
                ✓ Mark as Ready for Review
              </button>
            )}
          </div>
        )
      ) : null}

      {canReview && task.status === 'REVIEW' ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button className="h-8 border-[#6b2637] bg-[#371522] px-2 text-[9px] font-black text-[#ff9ab3] hover:bg-[#4a1d2c]" onClick={() => setReviewAction('REJECT')} variant="outline">
            <X className="mr-1 size-3" /> Changes
          </Button>
          <Button className="h-8 bg-[#FFD369] px-2 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]" onClick={() => setReviewAction('APPROVE')}>
            <Check className="mr-1 size-3" /> Approve
          </Button>
        </div>
      ) : null}

      {/* Filter comments for discussion */}
      {setCommentFilterMode && (
        <div className="mt-3">
          <span className="text-[10px] font-black uppercase text-[#dce7f3] mb-1.5 block">Discussion Filter</span>
          <select
            value={commentFilterMode}
            onChange={(e) => setCommentFilterMode?.(e.target.value as 'all' | 'frame' | 'general')}
            className="w-full rounded-[4px] bg-[#151c25] p-2 text-xs font-bold text-[#8b94a1] border border-[#26303b] outline-none hover:border-[#39424f] focus:border-[#FFD369] focus:text-white"
          >
            <option value="all">All Comments</option>
            <option value="frame">All Frame Comments</option>
            <option value="general">General Comments Only</option>
            {Array.from(new Set(discussionFrameComments.map(c => c.frameId))).sort((a, b) => {
              const idxA = frameDisplayIndexMap.get(String(a)) || Number(a);
              const idxB = frameDisplayIndexMap.get(String(b)) || Number(b);
              return idxA - idxB;
            }).map(frameId => {
              const displayIndex = frameDisplayIndexMap.get(String(frameId)) || frameId;
              return (
                <option key={`frame-${frameId}`} value={`frame:${frameId}`}>
                  Frame {displayIndex} Only
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Review History */}
      {task.submissions && task.submissions.length > 0 && (
        <div className="mt-6 space-y-2 border-t border-[#26303b] pt-4">
          <h3 className="text-[10px] font-black uppercase text-[#8b94a1]">Review History</h3>
          {task.submissions.map((submission) => {
            const parts = submission.note.split('\nReviewer:');
            const subNote = parts[0];
            const reviewerNote = parts.slice(1).join('\nReviewer:');
            const isApproved = submission.status === 'APPROVED';
            const isPending = submission.status === 'PENDING_REVIEW';
            const isChanges = submission.status === 'CHANGES_REQUESTED';
            
            return (
              <div key={submission.id} className="rounded-[4px] border border-[#303842] bg-[#151c25] p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-black uppercase text-[#8b94a1]">
                    Submitter Note
                  </p>
                  <span className={`text-[8px] font-bold uppercase ${isApproved ? 'text-[#9df2c7]' : isChanges ? 'text-[#ff9ab3]' : 'text-[#ffd35b]'}`}>
                    {submission.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="whitespace-pre-line text-[11px] leading-4 text-[#dce7f3]">{subNote.trim() || 'No note provided'}</p>
                
                {reviewerNote && (
                  <div className="mt-2 border-t border-[#303842] pt-2">
                    <p className={`text-[9px] font-black uppercase ${isApproved ? 'text-[#9df2c7]' : 'text-[#ff9ab3]'}`}>
                      {isApproved ? 'Approved Note' : 'Reject Reason'}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[11px] leading-4 text-[#dce7f3]">{reviewerNote.trim()}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </section>

      <ReviewTaskDialog
        action={reviewAction}
        onClose={() => setReviewAction(null)}
        onSubmit={handleReviewDirect}
      />
    </>
  );
}
