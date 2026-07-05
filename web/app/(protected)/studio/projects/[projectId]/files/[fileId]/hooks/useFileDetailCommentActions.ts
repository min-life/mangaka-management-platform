'use client';

import { toast } from '@/lib/toast';
import { createFileComment, updateComment, deleteComment } from '@/services/file.service';
import { createMaterialFrame } from '@/services/material.service';
import { createFrameComment } from '@/services/frame.service';
import { createTaskComment } from '@/services/task.service';
import type { FileExplorerItem, FileVersionItem, SubmissionFrameComment } from '../../file-ui';

type CommentActionsProps = {
  fileId: number;
  selectedVersion: FileVersionItem | null;
  versions: FileVersionItem[];
  selectedTaskId: string | null;
  file: FileExplorerItem | null;
  loadFile: () => Promise<void>;
  setError: (err: string | null) => void;
  setIsSavingComment: (val: boolean) => void;
  setPendingFrameRegion: (val: any) => void;
  setDraftRegion: (val: any) => void;
  setFrameAnnotationMode: (val: boolean) => void;
};

export function useFileDetailCommentActions({
  fileId,
  selectedVersion,
  versions,
  selectedTaskId,
  file,
  loadFile,
  setError,
  setIsSavingComment,
  setPendingFrameRegion,
  setDraftRegion,
  setFrameAnnotationMode,
}: CommentActionsProps) {
  const handleCreateFrameComment = async (comment: SubmissionFrameComment) => {
    try {
      const material = selectedVersion ?? versions[0];
      if (material) {
        const frame = await createMaterialFrame(material.id, {
          name: selectedTaskId ? `Task #${selectedTaskId}` : 'Review frame',
          startX: comment.region.startX,
          startY: comment.region.startY,
          endX: comment.region.endX,
          endY: comment.region.endY,
        });
        await createFrameComment(frame.id, {
          text: comment.content,
          taskId: selectedTaskId || undefined,
        });
        toast.success('Frame comment added.');
        await loadFile();
      }
    } catch (err) {
      console.error('Failed to create frame comment:', err);
      toast.error('Failed to save frame comment.');
      setError('Failed to save frame comment to server.');
    }
    setPendingFrameRegion(null);
    setDraftRegion(null);
    setFrameAnnotationMode(false);
  };

  const handleCreateDiscussionComment = async (commentContent: string) => {
    if (!file) return;
    setIsSavingComment(true);
    setError(null);
    try {
      if (selectedTaskId) {
        await createTaskComment(selectedTaskId, commentContent);
      } else {
        await createFileComment(file.id, commentContent);
      }
      toast.success('Comment posted.');
      await loadFile();
    } catch (err) {
      console.error('Failed to create comment:', err);
      toast.error('Failed to post comment.');
      setError('Failed to save comment.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleUpdateDiscussionComment = async (commentId: string, commentContent: string) => {
    setIsSavingComment(true);
    setError(null);
    try {
      await updateComment(commentId, commentContent);
      toast.success('Comment updated.');
      await loadFile();
    } catch (err) {
      console.error('Failed to update comment:', err);
      toast.error('Failed to update comment.');
      setError('Failed to update comment.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleDeleteDiscussionComment = async (commentId: string) => {
    setIsSavingComment(true);
    setError(null);
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted.');
      await loadFile();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment.');
      setError('Failed to delete comment.');
    } finally {
      setIsSavingComment(false);
    }
  };

  return {
    handleCreateFrameComment,
    handleCreateDiscussionComment,
    handleUpdateDiscussionComment,
    handleDeleteDiscussionComment,
  };
}
