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
      <div className="mt-3 flex flex-col gap-2 pr-1">
        {frameComments.map((item, index) => (
          <article
            className="group relative cursor-pointer rounded-r-[4px] border-y border-r border-[#303842] border-l-4 border-l-[#FFD369] bg-[#151c25] p-3 transition-colors hover:bg-[#1a232f]"
            key={item.id}
            onClick={() => onSelectFrame?.(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-5 shrink-0 place-items-center rounded-full bg-[#303842] text-[10px] font-black text-white">
                  {item.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-black text-white truncate max-w-[100px]">{item.author}</span>
                  {item.materialId !== currentMaterialId && (
                    <>
                      <span className="text-[#4b535f]">·</span>
                      <span className="truncate max-w-[120px] font-bold text-[#FFD369]" title={item.materialName || `Frame ${index + 1}`}>
                        {item.materialName || `Frame ${index + 1}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-[10px] font-bold text-[#8b94a1]">{item.time}</span>
                {onUpdateComment ? (
                  <button
                    aria-label="Edit comment"
                    className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] opacity-0 transition-opacity hover:bg-[#303842] hover:text-white group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(item);
                    }}
                    type="button"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                ) : null}
                {onDeleteComment ? (
                  <button
                    aria-label="Delete comment"
                    className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] opacity-0 transition-opacity hover:bg-red-950/40 hover:text-red-300 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDeleteComment(item.id);
                    }}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
            {editingCommentId === item.id ? (
              <div className="mt-2 pl-7" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-[4px] border border-[#39424f] bg-[#101820] p-2">
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
              </div>
            ) : (
              <div className="mt-1.5 pl-7 text-xs font-medium leading-5 text-[#dce7f3]">
                {item.content}
              </div>
            )}
          </article>
        ))}

        {comments.map((comment) => (
          <article 
            className="group rounded-r-[4px] border-y border-r border-[#303842] border-l-4 border-l-[#4b535f] bg-[#151c25] p-3" 
            key={comment.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-5 shrink-0 place-items-center rounded-full bg-[#303842] text-[10px] font-black text-white">
                  {comment.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-black text-white truncate max-w-[120px]">{comment.author}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-[10px] font-bold text-[#8b94a1]">{comment.time}</span>
                {onUpdateComment ? (
                  <button
                    aria-label="Edit comment"
                    className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] opacity-0 transition-opacity hover:bg-[#303842] hover:text-white group-hover:opacity-100"
                    onClick={() => startEditing(comment)}
                    type="button"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                ) : null}
                {onDeleteComment ? (
                  <button
                    aria-label="Delete comment"
                    className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] opacity-0 transition-opacity hover:bg-red-950/40 hover:text-red-300 group-hover:opacity-100"
                    onClick={() => void onDeleteComment(comment.id)}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
            {editingCommentId === comment.id ? (
              <div className="mt-2 pl-7">
                <div className="rounded-[4px] border border-[#39424f] bg-[#101820] p-2">
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
              </div>
            ) : (
              <div className="mt-1.5 pl-7 text-xs font-medium leading-5 text-[#dce7f3]">
                {comment.content}
              </div>
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
