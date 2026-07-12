'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Pencil, Reply, Send, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { SubmissionFrameComment } from '../file-ui';

type CommentItem = {
  author: string;
  content: string;
  id: string;
  time: string;
};

type FrameThread = {
  frameId: string;
  comments: SubmissionFrameComment[];
  region: SubmissionFrameComment['region'];
  materialVersion: string;
  materialName: string;
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
  onReplyToFrame?: (frameId: string, content: string) => Promise<void> | void;
  onSelectFrame?: (comment: SubmissionFrameComment) => void;
  onUpdateComment?: (commentId: string, content: string) => Promise<void> | void;
  replyingFrameId?: string | null;
  setReplyingFrameId?: (frameId: string | null) => void;
  taskId?: number | string | null;
  filterMode?: string;
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
  onReplyToFrame,
  onSelectFrame,
  onUpdateComment,
  replyingFrameId = null,
  setReplyingFrameId,
  taskId,
  filterMode = 'all',
}: FileCommentsPanelProps) {
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const replyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (replyingFrameId) {
      setTimeout(() => {
        replyRefs.current[replyingFrameId]?.focus();
      }, 150);
    }
  }, [replyingFrameId]);

  const displayComments = useMemo(() => {
    const frameCommentIds = new Set(frameComments.map(c => c.id));
    const filteredComments = comments.filter(c => !frameCommentIds.has(c.id));

    let combined = [...frameComments, ...filteredComments];
    if (filterMode === 'frame') {
      combined = [...frameComments];
    } else if (filterMode === 'general') {
      combined = filteredComments;
    } else if (filterMode.startsWith('frame:')) {
      const targetFrameId = filterMode.split(':')[1];
      combined = frameComments.filter(c => String(c.frameId) === targetFrameId);
    }

    return combined.sort((a, b) => {
      const idA = Number(a.id);
      const idB = Number(b.id);
      if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [comments, frameComments, filterMode]);

  const handleComment = async () => {
    if (!content.trim()) return;

    if (replyingFrameId && onReplyToFrame) {
      await onReplyToFrame(replyingFrameId, content.trim());
      setReplyingFrameId?.(null);
    } else if (onCreateComment) {
      await onCreateComment(content.trim());
    }

    setContent('');
  };

  const startEditing = (comment: CommentItem | SubmissionFrameComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const saveEditing = async () => {
    if (!editingContent.trim() || !onUpdateComment || !editingCommentId) return;
    await onUpdateComment(editingCommentId, editingContent.trim());
    setEditingCommentId(null);
    setEditingContent('');
  };

  return (
    <section data-context-key={contextKey}>
      <div className="flex flex-col gap-3 pr-1">
        {/* All comments */}
        {displayComments.map((comment) => {
          const isFrameComment = 'frameId' in comment;
          return (
            <article
              className={`group rounded-r-[4px] border-y border-r border-l-4 p-3 ${isFrameComment
                  ? 'border-[#ff9ab3]/30 border-l-[#ff9ab3] bg-[#160d11]'
                  : 'border-[#303842] border-l-[#4b535f] bg-[#151c25]'
                }`}
              key={comment.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${isFrameComment ? 'bg-[#2a1320] text-[#ff9ab3]' : 'bg-[#303842] text-white'
                    }`}>
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-black text-white truncate max-w-[120px]">{comment.author}</span>
                    <span className="text-[#4b535f]">·</span>
                    <span className="text-[10px] font-bold text-[#8b94a1]">{comment.time}</span>
                    {isFrameComment && (
                      <>
                        <span className="text-[#ff9ab3]/50">·</span>
                        <button
                          type="button"
                          onClick={() => onSelectFrame?.(comment as SubmissionFrameComment)}
                          className="text-[10px] font-black text-[#ff9ab3] hover:underline"
                        >
                          Frame {(comment as SubmissionFrameComment).frameId}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isFrameComment && setReplyingFrameId ? (
                    <button
                      aria-label="Reply to frame"
                      className="grid size-6 place-items-center rounded-[3px] text-[#ff9ab3] hover:bg-[#ff9ab3]/20 hover:text-white"
                      onClick={() => setReplyingFrameId((comment as SubmissionFrameComment).frameId || null)}
                      type="button"
                      title="Reply to this frame"
                    >
                      <Reply className="size-3.5" />
                    </button>
                  ) : null}
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
                      onClick={() => onDeleteComment(comment.id)}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 text-xs font-medium leading-relaxed text-[#aeb7c2]">
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full resize-none rounded-[4px] border border-[#39424f] bg-[#101820] px-3 py-2 text-white outline-none focus:border-[#FFD369]"
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={2}
                      value={editingContent}
                    />
                    <div className="flex justify-end gap-2">
                      <Button className="h-7 px-2 text-[10px]" onClick={cancelEditing} variant="ghost">
                        Cancel
                      </Button>
                      <Button
                        className="h-7 rounded-[4px] bg-[#FFD369] px-3 text-[10px] font-black text-[#222831] hover:bg-[#eac04f]"
                        disabled={!editingContent.trim() || isSaving}
                        onClick={saveEditing}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* New general comment input */}
      <div className={`mt-2 rounded-[4px] border transition-colors bg-[#151c25] p-3 ${replyingFrameId ? 'border-[#ff9ab3]' : 'border-[#39424f]'}`}>
        {replyingFrameId && (
          <div className="mb-2 flex items-center justify-between rounded bg-[#ff9ab3]/10 px-2 py-1 text-[10px] font-bold text-[#ff9ab3]">
            <span className="flex items-center gap-1.5"><Reply className="size-3" /> Replying to Frame {replyingFrameId}</span>
            <button
              onClick={() => setReplyingFrameId?.(null)}
              className="hover:text-white transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <textarea
          autoFocus={Boolean(replyingFrameId)}
          className="h-16 w-full resize-none bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
          onChange={(event) => setContent(event.target.value)}
          placeholder={replyingFrameId ? "Write a reply to this frame..." : "Write a review comment..."}
          value={content}
        />
        <div className="mt-2 flex justify-end">
          <Button
            className={`h-8 rounded-[4px] px-3 text-[10px] font-black text-[#222831] ${replyingFrameId ? 'bg-[#ff9ab3] hover:bg-[#ffb3c6]' : 'bg-[#FFD369] hover:bg-[#eac04f]'}`}
            disabled={!content.trim() || isSaving || (!onCreateComment && !onReplyToFrame)}
            onClick={() => void handleComment()}
          >
            <Send className="size-3.5" />
            {replyingFrameId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </section>
  );
}
