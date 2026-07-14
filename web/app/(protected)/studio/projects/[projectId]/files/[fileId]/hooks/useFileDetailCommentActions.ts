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
  user: any | null;
  setFrameComments: (update: any) => void;
  setComments: (update: any) => void;
  loadFile: () => Promise<void>;
  quietReload: () => Promise<void>;
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
  user,
  setFrameComments,
  setComments,
  loadFile,
  quietReload,
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
          startX: comment.region?.startX ?? 0,
          startY: comment.region?.startY ?? 0,
          endX: comment.region?.endX ?? 0,
          endY: comment.region?.endY ?? 0,
        });
        await createFrameComment(frame.id, {
          text: comment.content,
        });

        // Optimistically update the UI
        setFrameComments((prev: SubmissionFrameComment[]) => [
          ...prev,
          {
            ...comment,
            id: `temp-${Date.now()}`,
            frameId: String(frame.id),
            materialId: String(material.id),
            taskId: selectedTaskId || undefined,
            author: user?.displayName || user?.email || 'You',
            time: 'Just now',
          }
        ]);

        toast.success('Frame comment added.');
        void quietReload();
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

  const handleReplyToFrame = async (frameId: string, commentContent: string) => {
    setIsSavingComment(true);
    setError(null);
    try {
      await createFrameComment(frameId, {
        text: commentContent,
      });
      toast.success('Reply posted.');
      void quietReload();
    } catch (err) {
      console.error('Failed to reply to frame:', err);
      toast.error('Failed to post reply.');
      setError('Failed to save reply.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleCreateDiscussionComment = async (commentContent: string) => {
    if (!file) return;
    setIsSavingComment(true);
    setError(null);
    try {
      let createdComment;
      if (selectedTaskId) {
        createdComment = await createTaskComment(selectedTaskId, commentContent);
      } else {
        createdComment = await createFileComment(file.id, commentContent);
      }

      setComments((prev: any[]) => [
        ...prev,
        {
          id: String(createdComment?.id || `temp-${Date.now()}`),
          author: user?.displayName || user?.email || 'You',
          content: commentContent,
          time: 'Just now',
          context: selectedTaskId ? `task:${selectedTaskId}` : null,
        }
      ]);

      toast.success('Comment posted.');
      void quietReload();
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
      void quietReload();
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
      void quietReload();
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
    handleReplyToFrame,
    handleCreateDiscussionComment,
    handleUpdateDiscussionComment,
    handleDeleteDiscussionComment,
  };
}
