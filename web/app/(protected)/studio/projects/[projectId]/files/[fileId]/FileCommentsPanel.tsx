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

  // Group frame comments by frameId to create threads
  const frameThreads = useMemo<FrameThread[]>(() => {
    const map = new Map<string, FrameThread>();
    for (const fc of frameComments) {
      if (!fc.frameId) continue;
      if (!map.has(fc.frameId)) {
        map.set(fc.frameId, {
          frameId: fc.frameId,
          comments: [],
          region: fc.region,
          materialVersion: fc.materialVersion || '',
          materialName: fc.materialName || '',
        });
      }
      map.get(fc.frameId)!.comments.push(fc);
    }
    return Array.from(map.values());
  }, [frameComments]);

  const handleComment = async () => {
    if (!content.trim() || !onCreateComment) return;
    await onCreateComment(content.trim());
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
    if (!editingCommentId || !editingContent.trim() || !onUpdateComment) return;
    await onUpdateComment(editingCommentId, editingContent.trim());
    cancelEditing();
  };

  const openReply = (frameId: string) => {
    setReplyingFrameId?.(frameId);
    setReplyContent('');
    // Focus the textarea after state update
    setTimeout(() => {
      replyRefs.current[frameId]?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyingFrameId?.(null);
    setReplyContent('');
  };

  const submitReply = async (frameId: string) => {
    if (!replyContent.trim() || !onReplyToFrame) return;
    await onReplyToFrame(frameId, replyContent.trim());
    cancelReply();
  };

  return (
    <section data-context-key={contextKey}>
      <div className="flex flex-col gap-3 pr-1">
        {/* Frame comment threads */}
        {frameThreads.map((thread, threadIdx) => (
          <div
            id={`frame-thread-${thread.frameId}`}
            key={thread.frameId}
            className="rounded-[6px] border border-[#ff9ab3]/30 bg-[#160d11] overflow-hidden"
          >
            {/* Thread header */}
            <button
              className="flex w-full items-center gap-2 border-b border-[#ff9ab3]/20 bg-[#1f0f16] px-3 py-2 text-left transition-colors hover:bg-[#2a1320] cursor-pointer"
              onClick={() => onSelectFrame?.(thread.comments[0])}
              type="button"
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#ff9ab3] text-[9px] font-black text-[#371522]">
                F{threadIdx + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-black text-[#ff9ab3]">
                  Frame {threadIdx + 1}
                  {thread.materialName ? ` · ${thread.materialName}` : ''}
                </span>
                <span className="truncate text-[9px] font-bold text-[#8b94a1]">
                  {thread.comments.length} comment{thread.comments.length !== 1 ? 's' : ''} · click to view on canvas
                </span>
              </div>
              <span className="text-[9px] font-black text-[#ff9ab3]/50 uppercase tracking-wider">
                ↗
              </span>
            </button>

            {/* Comments in thread */}
            <div className="flex flex-col divide-y divide-[#1f1215]">
              {thread.comments.map((item) => (
                <article className="group p-3" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="grid size-5 shrink-0 place-items-center rounded-full bg-[#2a1320] text-[10px] font-black text-[#ff9ab3]">
                        {item.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-black text-white truncate max-w-[100px]">{item.author}</span>
                        <span className="text-[#4b535f]">·</span>
                        <span className="text-[10px] font-bold text-[#8b94a1]">{item.time}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onUpdateComment ? (
                        <button
                          aria-label="Edit comment"
                          className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] hover:bg-[#303842] hover:text-white"
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
                          className="grid size-6 place-items-center rounded-[3px] text-[#8b94a1] hover:bg-red-950/40 hover:text-red-300"
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
                    <div className="mt-2 pl-7">
                      <div className="rounded-[4px] border border-[#39424f] bg-[#101820] p-2">
                        <textarea
                          className="h-16 w-full resize-none bg-transparent text-xs font-medium leading-5 text-white outline-none"
                          onChange={(e) => setEditingContent(e.target.value)}
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
            </div>

            {/* Reply input for this thread */}
            {onReplyToFrame ? (
              replyingFrameId === thread.frameId ? (
                <div className="border-t border-[#ff9ab3]/15 bg-[#0f0a0c] p-3">
                  <textarea
                    ref={(el) => { replyRefs.current[thread.frameId] = el; }}
                    className="h-16 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#101820] px-3 py-2 text-xs font-medium text-white outline-none placeholder:text-[#8b94a1] focus:border-[#ff9ab3]/50"
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    value={replyContent}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button className="h-7 px-2 text-[10px]" onClick={cancelReply} variant="ghost">
                      <X className="size-3" />
                      Cancel
                    </Button>
                    <Button
                      className="h-7 rounded-[4px] bg-[#ff9ab3] px-3 text-[10px] font-black text-[#371522] hover:bg-[#ffb8cb]"
                      disabled={!replyContent.trim() || isSaving}
                      onClick={() => void submitReply(thread.frameId)}
                    >
                      <Send className="size-3" />
                      Reply
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-[#ff9ab3]/15">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-black text-[#8b94a1] hover:text-[#ff9ab3] hover:bg-[#1f0f16] transition-colors"
                    onClick={() => openReply(thread.frameId)}
                    type="button"
                  >
                    <Reply className="size-3" />
                    Reply to this frame...
                  </button>
                </div>
              )
            ) : null}
          </div>
        ))}

        {/* General comments */}
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

      {/* New general comment input */}
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
