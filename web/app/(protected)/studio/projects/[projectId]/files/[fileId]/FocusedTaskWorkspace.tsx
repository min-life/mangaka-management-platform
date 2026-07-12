'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ClipboardCheck, Crosshair, Edit3, FileUp, Trash2, UserRound, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
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
  selectedSubmissionId: string | null;
  task: TaskWorkspaceItem;
  targetVersion?: string;
  members?: Array<{ id: number; name: string }>;
  onRefresh?: () => void | Promise<void>;
  commentFilterMode?: string;
  setCommentFilterMode?: (mode: string) => void;
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
  selectedSubmissionId,
  task,
  targetVersion,
  members = [],
  onRefresh,
  commentFilterMode = 'all',
  setCommentFilterMode,
  discussionFrameComments = [],
}: FocusedTaskWorkspaceProps) {
  const [reviewNote, setReviewNote] = useState('');
  



  const selectedSubmission = task.submissions.find(
    (submission) => submission.id === selectedSubmissionId,
  );

  const handleReview = (approved: boolean) => {
    if (!selectedSubmission || !reviewNote.trim()) return;
    onTaskChange({
      ...task,
      status: approved ? 'DONE' : 'INPROGRESS',
      submissions: task.submissions.map((submission) =>
        submission.id === selectedSubmission.id
          ? {
              ...submission,
              note: `${submission.note}\nReviewer: ${reviewNote.trim()}`,
              status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
            }
          : submission,
      ),
      updatedAt: 'Just now',
    });
    setReviewNote('');
  };

  const handleReviewDirect = (approved: boolean) => {
    if (!reviewNote.trim()) return;
    onTaskChange({
      ...task,
      status: approved ? 'DONE' : 'INPROGRESS',
      submissions: task.submissions.map((submission) => ({
        ...submission,
        status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
        note: `${submission.note}\nReviewer: ${reviewNote.trim()}`,
      })),
      updatedAt: 'Just now',
    });
    setReviewNote('');
  };



  if (selectedSubmission) {
    const canAct = canReview && task.status === 'REVIEW' && selectedSubmission.status === 'PENDING_REVIEW';

    return (
      <>
        <section>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
              <FileUp className="size-4 text-[#FFD369]" /> Submission Review
            </h2>
            <div className="flex items-center gap-2">
              <Badge className="rounded-[3px] border border-[#6c5516] bg-[#30270d] text-[9px] text-[#ffd35b]">
                {selectedSubmission.status.replaceAll('_', ' ')}
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
          <p className="truncate text-xs font-black text-white">{selectedSubmission.assetName}</p>
          <p className="mt-1 text-[9px] font-bold text-[#8b94a1]">
            {selectedSubmission.submittedBy} · {selectedSubmission.submittedAt}
          </p>
          <p className="mt-2 text-[10px] leading-4 text-[#dce7f3]">{selectedSubmission.note}</p>
        </div>

        {canAct ? (
          <div className="mt-3">
            <Button
              className="h-8 border-[#6c5516] bg-[#30270d] px-3 text-[10px] font-black text-[#ffd35b] hover:bg-[#3a3011]"
              onClick={onStartFrameComment}
              variant="outline"
            >
              <Crosshair className="size-3.5" /> Frame Comment
            </Button>
            <textarea
              className="mt-3 h-16 w-full resize-none border border-[#39424f] bg-[#101820] p-2 text-[10px] text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Required review note..."
              value={reviewNote}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button className="h-8 border-[#6b2637] bg-[#371522] px-2 text-[9px] font-black text-[#ff9ab3] hover:bg-[#4a1d2c]" disabled={!reviewNote.trim()} onClick={() => handleReview(false)} variant="outline">
                <X className="size-3" /> Changes
              </Button>
              <Button className="h-8 bg-[#FFD369] px-2 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]" disabled={!reviewNote.trim()} onClick={() => handleReview(true)}>
                <Check className="size-3" /> Approve
              </Button>
            </div>
          </div>
        ) : null}

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

        {/* Filter comments for discussion */}
        {setCommentFilterMode && (
          <div className="mt-3">
            <span className="text-[10px] font-black uppercase text-[#dce7f3] mb-1.5 block">Discussion Filter</span>
            <select
              value={commentFilterMode}
              onChange={(e) => setCommentFilterMode(e.target.value)}
              className="w-full rounded-[4px] bg-[#151c25] p-2 text-xs font-bold text-[#8b94a1] border border-[#26303b] outline-none hover:border-[#39424f] focus:border-[#FFD369] focus:text-white"
            >
              <option value="all">All Comments</option>
              <option value="frame">All Frame Comments</option>
              <option value="general">General Comments Only</option>
              {Array.from(new Set(discussionFrameComments.map(c => c.frameId))).sort((a, b) => Number(a) - Number(b)).map(frameId => (
                <option key={`frame-${frameId}`} value={`frame:${frameId}`}>
                  Frame {frameId} Only
                </option>
              ))}
            </select>
          </div>
        )}
      </section>
    </>
  );
  }

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
        <p className="mt-2 text-[10px] leading-4 text-[#dce7f3]">{task.description}</p>

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
        <div className="mt-3">
          <textarea
            className="h-16 w-full resize-none border border-[#39424f] bg-[#101820] p-2 text-[10px] text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Required review note..."
            value={reviewNote}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button className="h-8 border-[#6b2637] bg-[#371522] px-2 text-[9px] font-black text-[#ff9ab3] hover:bg-[#4a1d2c]" disabled={!reviewNote.trim()} onClick={() => handleReviewDirect(false)} variant="outline">
              <X className="size-3" /> Changes
            </Button>
            <Button className="h-8 bg-[#FFD369] px-2 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]" disabled={!reviewNote.trim()} onClick={() => handleReviewDirect(true)}>
              <Check className="size-3" /> Approve
            </Button>
          </div>
        </div>
      ) : null}

      {/* Filter comments for discussion */}
      {setCommentFilterMode && (
        <div className="mt-3">
          <span className="text-[10px] font-black uppercase text-[#dce7f3] mb-1.5 block">Discussion Filter</span>
          <select
            value={commentFilterMode}
            onChange={(e) => setCommentFilterMode(e.target.value)}
            className="w-full rounded-[4px] bg-[#151c25] p-2 text-xs font-bold text-[#8b94a1] border border-[#26303b] outline-none hover:border-[#39424f] focus:border-[#FFD369] focus:text-white"
          >
            <option value="all">All Comments</option>
            <option value="frame">All Frame Comments</option>
            <option value="general">General Comments Only</option>
            {Array.from(new Set(discussionFrameComments.map(c => c.frameId))).sort((a, b) => Number(a) - Number(b)).map(frameId => (
              <option key={`frame-${frameId}`} value={`frame:${frameId}`}>
                Frame {frameId} Only
              </option>
            ))}
          </select>
        </div>
      )}
      </section>
    </>
  );
}
