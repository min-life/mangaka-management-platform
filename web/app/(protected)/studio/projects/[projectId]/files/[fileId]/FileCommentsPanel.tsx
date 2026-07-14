'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Loader2, MessageSquare, Pencil, Reply, Send, Trash2, X } from 'lucide-react';

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
  discussionListComments?: any[];
  focusedFrameId?: number | null;
  isFrameLoading?: boolean;
  isContextLoading?: boolean;
  handleFrameClick?: (frameId: string, materialId: string) => Promise<void>;

  comments?: CommentItem[];
  contextKey?: string;
  contextLabel?: string;
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
  setFilterMode?: Dispatch<SetStateAction<string>>;
  onLoadMore?: () => Promise<void> | void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
};

export function FileCommentsPanel({
  discussionListComments = [],
  focusedFrameId = null,
  isFrameLoading = false,
  isContextLoading = false,
  handleFrameClick,

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
  setFilterMode,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: FileCommentsPanelProps) {
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const replyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  useEffect(() => {
    if (replyingFrameId) {
      setTimeout(() => {
        replyRefs.current?.[replyingFrameId]?.focus();
      }, 150);
    }
  }, [replyingFrameId]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // After loading more (prepend), restore scroll position
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || isLoadingMore) return;
    const newScrollHeight = el.scrollHeight;
    const diff = newScrollHeight - prevScrollHeightRef.current;
    if (diff > 0 && prevScrollHeightRef.current > 0) {
      el.scrollTop = diff;
      prevScrollHeightRef.current = 0;
    }
  }, [isLoadingMore]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || !onLoadMore || !hasMore || isLoadingMore) return;
    if (el.scrollTop < 60) {
      prevScrollHeightRef.current = el.scrollHeight;
      void onLoadMore();
    }
  };

  const frameDisplayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    frameComments.forEach(fc => {
      const fId = String(fc.frameId || fc.id);
      if (!map.has(fId)) {
        map.set(fId, map.size + 1);
      }
    });
    return map;
  }, [frameComments]);

  const fallbackComments = useMemo(() => {
    if (discussionListComments.length > 0) return [];
    
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
  }, [comments, frameComments, filterMode, discussionListComments.length]);

  const displayComments = discussionListComments.length > 0 
    ? discussionListComments 
    : fallbackComments;

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
    <section data-context-key={contextKey} className="flex flex-col h-full">
      {setFilterMode && (
        <div className="mb-4 shrink-0 flex items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase text-[#dce7f3]">Filter</span>
          <select
            value={filterMode}
            onChange={(e) => {
              const val = e.target.value;
              setFilterMode(val);
              if (val.startsWith('frame:')) {
                const fId = val.replace('frame:', '');
                const targetComment = frameComments.find(c => String(c.frameId) === String(fId));
                if (targetComment) {
                  if (handleFrameClick && targetComment.materialId) {
                    handleFrameClick(String(targetComment.frameId), String(targetComment.materialId));
                  } else {
                    onSelectFrame?.(targetComment);
                  }
                }
              }
            }}
            className="w-fit max-w-[200px] rounded-[4px] bg-[#151c25] py-1.5 px-2 text-xs font-bold text-[#8b94a1] border border-[#26303b] outline-none hover:border-[#39424f] focus:border-[#FFD369] focus:text-white cursor-pointer"
          >
            <option value="all">All Comments</option>
            <option value="frame">All Frame Comments</option>
            <option value="general">General Comments Only</option>
            {Array.from(new Set(frameComments.map(c => c.frameId))).sort((a, b) => {
              const idxA = frameDisplayIndexMap.get(String(a)) || Number(a);
              const idxB = frameDisplayIndexMap.get(String(b)) || Number(b);
              return idxA - idxB;
            }).map(frameId => {
              const displayIndex = frameDisplayIndexMap.get(String(frameId)) || frameId;
              const targetComment = frameComments.find(c => String(c.frameId) === String(frameId));
              const displayName = targetComment?.frameName || `Frame ${displayIndex}`;
              return (
                <option key={`frame-${frameId}`} value={`frame:${frameId}`}>
                  {displayName} Only
                </option>
              );
            })}
          </select>
        </div>
      )}
      <div
        id="discussion-scroll-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto pr-1"
        style={{ maxHeight: 'calc(100vh - 380px)' }}
      >
        {isContextLoading ? (
          <div className="flex h-full items-center justify-center min-h-[150px]">
            <Loader2 className="size-6 animate-spin text-[#8b94a1]" />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center py-2">
                {isLoadingMore
                  ? <Loader2 className="size-4 animate-spin text-[#8b94a1]" />
                  : <button type="button" onClick={() => void onLoadMore?.()} className="text-[10px] font-bold text-[#8b94a1] hover:text-white transition-colors">Load older comments</button>
                }
              </div>
            )}
            <div className="flex flex-col gap-3">
            {displayComments.map((comment) => {
              const isFrameComment = 'frameId' in comment;
          const displayIndex = isFrameComment ? frameDisplayIndexMap.get(String((comment as SubmissionFrameComment).frameId || comment.id)) : undefined;
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
                          disabled={isFrameLoading}
                          onClick={() => {
                            if (handleFrameClick && 'frameId' in comment && 'materialId' in comment && comment.materialId) {
                              handleFrameClick(String(comment.frameId), String(comment.materialId));
                            } else {
                              onSelectFrame?.(comment as SubmissionFrameComment);
                            }
                          }}
                          className={`text-[10px] font-black ${
                            String(focusedFrameId) === String((comment as any).frameId)
                              ? 'text-white underline decoration-[#ff9ab3]'
                              : 'text-[#ff9ab3] hover:underline'
                          } ${isFrameLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {comment.frameName || `Frame ${displayIndex}`}
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
        </>
        )}
      </div>

      <div className={`mt-2 shrink-0 rounded-[4px] border transition-colors bg-[#151c25] p-3 ${replyingFrameId ? 'border-[#ff9ab3]' : 'border-[#39424f]'}`}>
        {replyingFrameId && (
          <div className="mb-2 flex items-center justify-between rounded bg-[#ff9ab3]/10 px-2 py-1 text-[10px] font-bold text-[#ff9ab3]">
            <span className="flex items-center gap-1.5"><Reply className="size-3" /> Replying to Frame {frameDisplayIndexMap.get(String(replyingFrameId))}</span>
            <button
              onClick={() => setReplyingFrameId?.(null)}
              className="hover:text-white transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <textarea
          id="comment-input"
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
