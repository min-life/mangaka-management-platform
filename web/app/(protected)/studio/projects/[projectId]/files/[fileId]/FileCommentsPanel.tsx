'use client';

import { useState } from 'react';
import { MessageSquare, Pencil, Send, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { SubmissionFrameComment } from '../file-ui';

type CommentItem = {
  author: string;
  content: string;
  id: string;
  time: string;
};

type FileCommentsPanelProps = {
  comments?: CommentItem[];
  contextKey: string;
  contextLabel: string;
  currentMaterialId?: string | null;
  fileId?: number | string;
  frameComments?: SubmissionFrameComment[];
  isSaving?: boolean;
  onCreateComment?: (content: string) => Promise<void> | void;
  onDeleteComment?: (commentId: string) => Promise<void> | void;
  onSelectFrame?: (comment: SubmissionFrameComment) => void;
  onUpdateComment?: (commentId: string, content: string) => Promise<void> | void;
  taskId?: number | string | null;
};

export function FileCommentsPanel({
  comments = [],
  contextKey,
  contextLabel,
  currentMaterialId,
  fileId,
  frameComments = [],
  isSaving = false,
  onCreateComment,
  onDeleteComment,
  onSelectFrame,
  onUpdateComment,
  taskId,
}: FileCommentsPanelProps) {
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleComment = async () => {
    if (!content.trim() || !onCreateComment) return;
    await onCreateComment(content.trim());
    setContent('');
  };

  const startEditing = (comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const saveEditing = async () => {
    if (!editingCommentId || !editingContent.trim() || !onUpdateComment) return;
    await onUpdateComment(editingCommentId, editingContent.trim());
    cancelEditing();
  };

  return (
    <section data-context-key={contextKey}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
          <MessageSquare className="size-4 text-[#FFD369]" />
          Discussion
        </div>
        <span className="text-[10px] font-black text-[#8b94a1]">
          {comments.length + frameComments.length}
        </span>
      </div>
      <div className="mt-3 border border-[#39424f] bg-[#202832] px-3 py-2">
        <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">Context</p>
        <p className="mt-1 truncate text-xs font-black text-[#FFD369]">{contextLabel}</p>
        {fileId || taskId ? (
          <p className="mt-1 text-[9px] font-bold text-[#8b94a1]">
            {fileId ? `File #${fileId}` : null}
            {fileId && taskId ? ' - ' : null}
            {taskId ? `Task #${taskId}` : null}
          </p>
        ) : null}
      </div>
      <div className="mt-3 space-y-2 pr-1">
        {frameComments.map((item, index) => (
          <button
            className="w-full border border-[#6c5516] bg-[#30270d] p-3 text-left hover:bg-[#3a3011]"
            key={item.id}
            onClick={() => onSelectFrame?.(item)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-[#ffd35b]">Frame {index + 1} - {item.author}</p>
              <div className="flex shrink-0 items-center gap-2">
                {item.materialVersion && item.materialId !== currentMaterialId ? (
                  <span className="rounded-[3px] border border-[#6c5516] bg-[#191307] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#FFD369]">
                    {item.materialVersion}
                  </span>
                ) : null}
                <p className="text-[10px] font-bold text-[#d9bd70]">{item.time}</p>
              </div>
            </div>
            {item.taskId ? (
              <p className="mt-1 text-[10px] font-bold text-[#caa95a]">
                Task #{item.taskId}
              </p>
            ) : null}
            <p className="mt-2 text-xs font-medium leading-5 text-[#fff0bc]">{item.content}</p>
          </button>
        ))}
        {comments.map((comment) => (
          <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-3" key={comment.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-white">{comment.author}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-[#8b94a1]">{comment.time}</p>
                {onUpdateComment ? (
                  <button
                    aria-label="Edit comment"
                    className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] hover:bg-[#303842] hover:text-white"
                    onClick={() => startEditing(comment)}
                    type="button"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                ) : null}
                {onDeleteComment ? (
                  <button
                    aria-label="Delete comment"
                    className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] hover:bg-red-950/40 hover:text-red-300"
                    onClick={() => void onDeleteComment(comment.id)}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
            {editingCommentId === comment.id ? (
              <div className="mt-3 rounded-[4px] border border-[#39424f] bg-[#101820] p-2">
                <textarea
                  className="h-20 w-full resize-none bg-transparent text-xs font-medium leading-5 text-white outline-none"
                  onChange={(event) => setEditingContent(event.target.value)}
                  value={editingContent}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button className="h-7 px-2 text-[10px]" onClick={cancelEditing} variant="ghost">
                    <X className="size-3" />
                    Cancel
                  </Button>
                  <Button
                    className="h-7 rounded-[4px] bg-[#FFD369] px-3 text-[10px] font-black text-[#222831] hover:bg-[#eac04f]"
                    disabled={!editingContent.trim() || isSaving}
                    onClick={() => void saveEditing()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium leading-5 text-[#dce7f3]">{comment.content}</p>
            )}
          </article>
        ))}
      </div>
      <div className="mt-4 rounded-[4px] border border-[#39424f] bg-[#151c25] p-3">
        <textarea
          className="h-16 w-full resize-none bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a review comment..."
          value={content}
        />
        <div className="mt-2 flex justify-end">
          <Button
            className="h-8 rounded-[4px] bg-[#FFD369] px-3 text-[10px] font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={!content.trim() || isSaving || !onCreateComment}
            onClick={() => void handleComment()}
          >
            <Send className="size-3.5" />
            Comment
          </Button>
        </div>
      </div>
    </section>
  );
}
