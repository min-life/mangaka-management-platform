'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Check, FileUp, X, AlertTriangle, Download, UserCircle, Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeComments } from '@/hooks/use-realtime-activity';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { ApplicationResponse, ApplicationStatus, ApplicationCommentResponse } from '@/services/application.service';
import { 
  getApplicationComments, 
  createApplicationComment,
  updateApplicationComment,
  deleteApplicationComment
} from '@/services/application.service';

const COMMENT_PAGE_SIZE = 10;

type CommentPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

import {
  applicationStatusClassName,
  applicationTypeLabels,
  formatDate,
  formatFileSize,
  formatStatus,
  readUploadedFiles,
} from './application-ui';

type ApplicationReviewDrawerProps = {
  application: ApplicationResponse | null;
  canApprove: boolean;
  canSubmit: boolean;
  canCancel: boolean;
  isLoadingDetail?: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (
    application: ApplicationResponse,
    status: ApplicationStatus,
    options?: { rejectionReason?: string },
  ) => void;
  rejectionReason?: string;
};

export function ApplicationReviewDrawer({
  application,
  canApprove,
  canSubmit,
  canCancel,
  isLoadingDetail,
  isSubmitting,
  onOpenChange,
  onUpdateStatus,
  rejectionReason,
}: ApplicationReviewDrawerProps) {
  const { user } = useAuth();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [draftRejectReason, setDraftRejectReason] = useState('');

  const uploadedFiles = useMemo(() => (application ? readUploadedFiles(application.materials) : []), [application]);
  const submittedBy =
    application?.createdByUser?.displayName ??
    application?.createdByUser?.email ??
    (application?.createdBy ? `User #${application.createdBy}` : 'Unknown user');
  const reviewedBy =
    application?.verifiedByUser?.displayName ??
    application?.verifiedByUser?.email ??
    (application?.verifyBy ? `User #${application.verifyBy}` : null);
  const displayedRejectionReason =
    rejectionReason ??
    (application?.status === 'REJECT'
      ? 'No rejection reason provided.'
      : undefined);
  const canConfirmReject = draftRejectReason.trim().length > 0 && !isSubmitting;

  const [comments, setComments] = useState<ApplicationCommentResponse[]>([]);
  const [commentPagination, setCommentPagination] = useState<CommentPagination | null>(null);
  const [commentsError, setCommentsError] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [updatingCommentId, setUpdatingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<number | null>(null);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentItemRefs = useRef(new Map<number, HTMLDivElement>());
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollCommentsToBottomRef = useRef(false);
  const isLoadingOlderCommentsRef = useRef(false);

  const { createdComments, deletedCommentIds, updatedComments } = useRealtimeComments(
    'APPLICATION',
    application?.id,
  );

  const getCommentText = (content: any) => {
    return typeof content === 'object' && content !== null ? content.text ?? '' : typeof content === 'string' ? content : '';
  };

  const normalizeComments = useCallback((commentList: ApplicationCommentResponse[]) => {
    const uniqueMap = new Map<number, ApplicationCommentResponse>();
    commentList.forEach((comment) => {
      if (typeof comment.content === 'object' && comment.content !== null && (comment.content as any).kind === 'REJECTION_REASON') {
        return;
      }
      uniqueMap.set(comment.id, comment);
    });
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, []);

  const mergeComment = useCallback((comment: ApplicationCommentResponse) => {
    setComments((currentComments) => {
      const exists = currentComments.some((c) => c.id === comment.id);
      const newArray = exists
        ? currentComments.map((c) => (c.id === comment.id ? comment : c))
        : [...currentComments, comment];
      return normalizeComments(newArray);
    });
  }, [normalizeComments]);

  const handleReply = (displayName: string | null | undefined) => {
    if (displayName) {
      setNewComment(`@${displayName} `);
      commentInputRef.current?.focus();
    }
  };

  const handleSendComment = async () => {
    if (!application) return;
    if (!newComment.trim()) return;

    setIsSendingComment(true);
    setCommentsError('');

    try {
      const response = await createApplicationComment(application.id, newComment.trim());
      if (response) {
        shouldScrollCommentsToBottomRef.current = true;
        mergeComment(response);
      }
      setNewComment('');
    } catch {
      setCommentsError('Unable to send comment.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleStartEditComment = (comment: ApplicationCommentResponse) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(getCommentText(comment.content));
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
    setCommentsError('');
  };

  const handleUpdateComment = async (commentId: number) => {
    const trimmedText = editingCommentText.trim();
    if (!trimmedText || !application) return;

    setUpdatingCommentId(commentId);
    setCommentsError('');

    try {
      const response = await updateApplicationComment(commentId, trimmedText);
      if (response) {
        mergeComment(response);
        handleCancelEditComment();
      }
    } catch {
      setCommentsError('Unable to update comment.');
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentId(commentId);
    setCommentsError('');

    try {
      await deleteApplicationComment(commentId);
      setComments((currentComments) => currentComments.filter((c) => c.id !== commentId));
      setPendingDeleteCommentId(null);
    } catch {
      setCommentsError('Unable to delete comment.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const renderCommentText = (text: string) => {
    if (text.startsWith('@')) {
      const firstSpaceIndex = text.indexOf(' ', text.indexOf(' ') + 1);
      if (firstSpaceIndex !== -1) {
        const mention = text.substring(0, firstSpaceIndex);
        const rest = text.substring(firstSpaceIndex);
        return (
          <>
            <span className="font-medium text-[#FFD369]">{mention}</span>
            {rest}
          </>
        );
      }
    }
    return text;
  };

  useEffect(() => {
    if (!application?.id) {
      return;
    }

    const applicationId = application.id;
    let isMounted = true;

    async function loadComments() {
      setIsLoadingComments(true);
      setCommentsError('');
      setCommentPagination(null);

      try {
        const response = await getApplicationComments(applicationId, { limit: COMMENT_PAGE_SIZE, page: 1 });
        if (isMounted) {
          setComments(normalizeComments(response.comments));
          setCommentPagination(response.pagination ?? null);
          shouldScrollCommentsToBottomRef.current = true;
        }
      } catch {
        if (isMounted) {
          setComments([]);
          setCommentsError('Unable to load comments.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingComments(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [application?.id, normalizeComments]);

  useEffect(() => {
    const newestComment = createdComments.at(-1) as ApplicationCommentResponse | undefined;
    if (newestComment) {
      const scrollElement = commentsScrollRef.current;
      const isViewingLatest = scrollElement
        ? scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 72
        : true;

      shouldScrollCommentsToBottomRef.current = isViewingLatest;
      queueMicrotask(() => mergeComment(newestComment));
    }
  }, [createdComments, mergeComment]);

  useEffect(() => {
    if (updatedComments.length > 0) {
      setComments((currentComments) => {
        let changed = false;
        const newComments = currentComments.map((c) => {
          const updated = (updatedComments as ApplicationCommentResponse[]).find((uc) => uc.id === c.id);
          if (updated) {
            changed = true;
            return updated;
          }
          return c;
        });
        return changed ? normalizeComments(newComments) : currentComments;
      });
    }
  }, [updatedComments, normalizeComments]);

  useEffect(() => {
    if (deletedCommentIds.length > 0) {
      setComments((currentComments) =>
        currentComments.filter((c) => !deletedCommentIds.includes(c.id)),
      );
    }
  }, [deletedCommentIds]);

  const loadOlderComments = async () => {
    if (
      !application ||
      !commentPagination ||
      commentPagination.page >= commentPagination.totalPages ||
      isLoadingOlderCommentsRef.current
    ) {
      return;
    }

    isLoadingOlderCommentsRef.current = true;
    setIsLoadingOlderComments(true);
    setCommentsError('');

    try {
      const currentScrollElement = commentsScrollRef.current;
      const previousScrollHeight = currentScrollElement ? currentScrollElement.scrollHeight : 0;

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      const result = await getApplicationComments(application.id, {
        limit: COMMENT_PAGE_SIZE,
        page: commentPagination.page + 1,
      });

      setComments((currentComments) => normalizeComments([...result.comments, ...currentComments]));
      setCommentPagination(
        result.pagination
          ? {
              page: result.pagination.page,
              total: result.pagination.total,
              totalPages: result.pagination.totalPages,
              limit: result.pagination.limit ?? COMMENT_PAGE_SIZE,
            }
          : commentPagination,
      );

      window.requestAnimationFrame(() => {
        if (currentScrollElement) {
          currentScrollElement.scrollTop =
            currentScrollElement.scrollHeight -
            previousScrollHeight +
            currentScrollElement.scrollTop;
        }
      });
    } catch (error) {
      setCommentsError('Unable to load older comments.');
    } finally {
      isLoadingOlderCommentsRef.current = false;
      setIsLoadingOlderComments(false);
    }
  };

  const handleCommentsScroll = () => {
    const scrollElement = commentsScrollRef.current;
    if (!scrollElement || scrollElement.scrollTop > 32) {
      return;
    }
    void loadOlderComments();
  };

  useEffect(() => {
    if (!shouldScrollCommentsToBottomRef.current || isLoadingComments || isLoadingOlderComments) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const scrollElement = commentsScrollRef.current;
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
      shouldScrollCommentsToBottomRef.current = false;
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [comments.length, isLoadingComments, isLoadingOlderComments]);

  const handleOpenRejectDialog = () => {
    setDraftRejectReason(rejectionReason ?? '');
    setRejectDialogOpen(true);
  };

  const handleOpenApproveDialog = () => {
    setApproveDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!application || !canConfirmReject) {
      return;
    }

    onUpdateStatus(application, 'REJECT', { rejectionReason: draftRejectReason.trim() });
    setRejectDialogOpen(false);
  };

  return (
    <>
      <Sheet onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setComments([]);
          setCommentPagination(null);
          isLoadingOlderCommentsRef.current = false;
          setIsLoadingOlderComments(false);
          handleCancelEditComment();
          setDeletingCommentId(null);
          setUpdatingCommentId(null);
          setPendingDeleteCommentId(null);
          setNewComment('');
          setCommentsError('');
        }
      }} open={Boolean(application)}>
        <SheetContent
          className="w-[540px] max-w-[92vw] gap-0 border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[540px]"
          showCloseButton={false}
          side="right"
        >
          {application ? (
            <>
              <SheetHeader className="relative border-b border-[#303842] px-5 py-5 pr-14">
                <button
                  className="absolute right-4 top-4 grid size-8 place-items-center rounded-[4px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <SheetTitle className="text-xl font-black text-white">
                      {application.title}
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-xs font-bold text-[#aeb7c2]">
                      Submitted {formatDate(application.createdAt)}
                    </SheetDescription>
                  </div>
                  <Badge
                    className={`mt-0.5 h-7 shrink-0 rounded-full border px-3 text-[11px] font-bold ${applicationStatusClassName[application.status]}`}
                    variant="outline"
                  >
                    {formatStatus(application.status)}
                  </Badge>
                </div>
              </SheetHeader>

              <div 
                className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-gutter:stable]"
              >
                <div className="grid grid-cols-2 gap-3">
                  <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Type
                    </p>
                    <p className="mt-3 text-sm font-black text-white">
                      {applicationTypeLabels[application.type]}
                    </p>
                  </article>
                  <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Submitted By
                    </p>
                    <p className="mt-3 truncate text-sm font-black text-white">{submittedBy}</p>
                  </article>
                  <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Submitted At
                    </p>
                    <p className="mt-3 text-sm font-black text-white">
                      {formatDate(application.createdAt)}
                    </p>
                  </article>
                  <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Reviewed By
                    </p>
                    <p className="mt-3 truncate text-sm font-black text-white">
                      {reviewedBy ?? (application.status === 'PENDING' ? 'Not reviewed yet' : 'Unknown reviewer')}
                    </p>
                  </article>
                </div>

                <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Description
                  </p>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#dce7f3]">
                    {application.description ?? 'No description provided.'}
                  </p>
                </section>

                {application.status === 'REJECT' && displayedRejectionReason ? (
                  <section className="mt-4 rounded-[4px] border border-[#6b2637] bg-[#371522]/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#ff9ab3]">
                        Rejection Reason
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-[#ffd5df]">
                      {displayedRejectionReason}
                    </p>
                  </section>
                ) : null}

                <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Uploaded Files
                  </p>
                  <div className="mt-3 space-y-2">
                    {isLoadingDetail ? (
                      <div className="flex min-h-12 items-center gap-3 rounded-[3px] border border-[#303842] bg-[#101820] px-3 py-2">
                        <div className="size-4 shrink-0 animate-pulse rounded bg-[#1f2937]" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="h-3 w-1/2 animate-pulse rounded bg-[#1f2937]" />
                          <div className="h-2 w-1/3 animate-pulse rounded bg-[#1f2937]" />
                        </div>
                      </div>
                    ) : uploadedFiles.length ? (
                      uploadedFiles.map((file) => {
                        const content = (
                          <>
                            <FileUp className="size-4 shrink-0 text-[#FFD369]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-black text-white">{file.name}</p>
                              <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                                {file.mimeType ?? 'Unknown type'} - {formatFileSize(file.sizeBytes)}
                              </p>
                            </div>
                            {file.url ? (
                              <Download className="size-4 shrink-0 text-[#aeb7c2] transition-colors group-hover:text-white" />
                            ) : null}
                          </>
                        );

                        const wrapperClassName = "group flex min-h-12 items-center gap-3 rounded-[3px] border border-[#303842] bg-[#101820] px-3 py-2 transition-colors hover:border-[#4b535f] hover:bg-[#151c25]";
                        const key = `${file.name}-${file.sizeBytes ?? 'unknown'}`;

                        if (file.url) {
                          return (
                            <Link
                              className={wrapperClassName}
                              href={file.url}
                              key={key}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {content}
                            </Link>
                          );
                        }

                        return (
                          <div className={wrapperClassName} key={key}>
                            {content}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs font-bold text-[#aeb7c2]">No uploaded files.</p>
                    )}
                  </div>
                </section>

                <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Activity
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <span className="mt-1 size-2 rounded-full bg-[#FFD369]" />
                      <div>
                        <p className="text-xs font-black text-white">Submitted</p>
                        <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                          {submittedBy} submitted this request on {formatDate(application.createdAt)}.
                        </p>
                      </div>
                    </div>
                    {application.status === 'PENDING' ? (
                      <div className="flex gap-3">
                        <span className="mt-1 size-2 rounded-full bg-[#4b535f]" />
                        <div>
                          <p className="text-xs font-black text-white">Waiting for review</p>
                          <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                            No review event has been recorded yet.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <span
                          className={`mt-1 size-2 rounded-full ${application.status === 'APPROVE' ? 'bg-[#9df2c7]' : 'bg-[#ff9ab3]'
                            }`}
                        />
                        <div>
                          <p className="text-xs font-black text-white">
                            {formatStatus(application.status)}
                          </p>
                          <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                            {reviewedBy ?? 'Reviewer'} updated this request on{' '}
                            {formatDate(application.updatedAt)}.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1] mb-4">
                    Comments
                  </p>

                  <div className="flex flex-col">
                    {commentsError ? (
                      <p className="mb-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-3 py-2 text-xs font-bold text-red-300">
                        {commentsError}
                      </p>
                    ) : null}

                    {isLoadingComments ? (
                      <p className="mb-4 text-xs font-bold text-[#8b94a1]">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-xs font-bold text-[#8b94a1] mb-4">
                        No comments yet. Start the discussion!
                      </p>
                    ) : (
                      <div
                        ref={commentsScrollRef}
                        className="no-scrollbar mb-4 max-h-80 space-y-3 overflow-y-auto pr-1"
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          const isViewingLatest =
                            target.scrollHeight - target.scrollTop - target.clientHeight < 72;
                          shouldScrollCommentsToBottomRef.current = isViewingLatest;
                          handleCommentsScroll();
                        }}
                      >
                        {isLoadingOlderComments ? (
                          <div className="flex justify-center py-2">
                            <Loader2 className="size-4 animate-spin text-[#FFD369]" />
                          </div>
                        ) : null}
                        {comments.map((comment) => {
                          const isCurrentUserComment = comment.createdByUser?.id === user?.id;
                          const commentText = getCommentText(comment.content);
                          const isEditingComment = editingCommentId === comment.id;
                          const isUpdatingComment = updatingCommentId === comment.id;
                          const isDeletingComment = deletingCommentId === comment.id;

                          return (
                            <div
                              className={`flex gap-3 rounded-[4px] border p-3 ${
                                isCurrentUserComment
                                  ? 'border-[#FFD369]/35 bg-[#1d2630]'
                                  : 'border-transparent bg-[#101820]'
                              }`}
                              key={comment.id}
                              ref={(element) => {
                                if (element) {
                                  commentItemRefs.current.set(comment.id, element);
                                } else {
                                  commentItemRefs.current.delete(comment.id);
                                }
                              }}
                            >
                              {comment.createdByUser?.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={comment.createdByUser.avatarUrl}
                                  alt="Avatar"
                                  className="size-8 rounded-full shrink-0"
                                />
                              ) : (
                                <UserCircle className="size-8 text-[#8b94a1] shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p
                                    className={`text-xs ${
                                      isCurrentUserComment
                                        ? 'font-black text-[#FFD369]'
                                        : 'font-bold text-[#dce7f3]'
                                    }`}
                                  >
                                    {comment.createdByUser?.displayName ||
                                      comment.createdByUser?.email ||
                                      'Unknown User'}
                                  </p>
                                  <span className="text-[10px] font-bold text-[#4b535f]">
                                    {new Date(comment.createdAt).toLocaleDateString()}{' '}
                                    {new Date(comment.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {isEditingComment ? (
                                  <div className="mt-2">
                                    <Textarea
                                      className="min-h-16 resize-none border-[#39424f] bg-[#101820] text-xs font-medium text-white placeholder:text-[#4b535f] focus-visible:ring-[#FFD369]"
                                      disabled={isUpdatingComment}
                                      onChange={(event) => setEditingCommentText(event.target.value)}
                                      value={editingCommentText}
                                    />
                                    <div className="mt-2 flex justify-end gap-2">
                                      <Button
                                        className="h-7 rounded-[4px] border-[#4b535f] bg-[#101820] px-3 text-[10px] font-black text-[#dce7f3] hover:bg-[#303842]"
                                        disabled={isUpdatingComment}
                                        onClick={handleCancelEditComment}
                                        type="button"
                                        variant="outline"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        className="h-7 rounded-[4px] bg-[#FFD369] px-3 text-[10px] font-black text-[#222831] hover:bg-[#eac04f]"
                                        disabled={!editingCommentText.trim() || isUpdatingComment}
                                        onClick={() => void handleUpdateComment(comment.id)}
                                        type="button"
                                      >
                                        {isUpdatingComment ? 'Saving...' : 'Save'}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1 flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`whitespace-pre-wrap break-words text-xs text-[#dce7f3] ${
                                          isCurrentUserComment ? 'font-semibold' : 'font-medium'
                                        }`}
                                      >
                                        {renderCommentText(commentText)}
                                      </p>
                                      <button
                                        className="mt-2 text-[10px] font-bold text-[#8b94a1] hover:text-white transition-colors"
                                        onClick={() => handleReply(comment.createdByUser?.displayName)}
                                      >
                                        Reply
                                      </button>
                                    </div>
                                    {isCurrentUserComment ? (
                                      <div className="flex shrink-0 items-center gap-1">
                                        <button
                                          className="grid size-7 place-items-center rounded-[4px] text-[#8b94a1] transition-colors hover:bg-[#303842] hover:text-[#FFD369]"
                                          disabled={isDeletingComment}
                                          onClick={() => handleStartEditComment(comment)}
                                          title="Edit comment"
                                          type="button"
                                        >
                                          <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                          className="grid size-7 place-items-center rounded-[4px] text-[#8b94a1] transition-colors hover:bg-[#371522] hover:text-[#ff9ab3] disabled:cursor-not-allowed disabled:opacity-50"
                                          disabled={isDeletingComment}
                                          onClick={() => setPendingDeleteCommentId(comment.id)}
                                          title="Delete comment"
                                          type="button"
                                        >
                                          {isDeletingComment ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="size-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-auto border-t border-[#303842] pt-4">
                      <Textarea
                        ref={commentInputRef}
                        placeholder="Write a comment..."
                        className="min-h-16 resize-none border-[#303842] bg-[#101820] text-xs font-medium text-white placeholder:text-[#4b535f] focus-visible:ring-[#FFD369]"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="mt-3 flex justify-end">
                        <Button
                          className="h-8 rounded-[4px] bg-[#FFD369] px-4 text-[11px] font-black text-[#222831] hover:bg-[#eac04f]"
                          onClick={() => void handleSendComment()}
                          disabled={!newComment.trim() || isSendingComment}
                        >
                          <Check className="mr-1.5 size-3" />
                          {isSendingComment ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                {(canApprove && application.status === 'SUBMITTED') || (canSubmit && application.status === 'PENDING') ? (
                  <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Review Actions
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Button
                        className="h-10 rounded-[4px] border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
                        disabled={isSubmitting}
                        onClick={handleOpenRejectDialog}
                        type="button"
                        variant="outline"
                      >
                        <X className="mr-1.5 size-4" />
                        Reject
                      </Button>
                      {application.status === 'PENDING' ? (
                        <Button
                          className="h-10 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
                          disabled={isSubmitting}
                          onClick={handleOpenApproveDialog}
                          type="button"
                        >
                          <Check className="mr-1.5 size-4" />
                          Submit to Board
                        </Button>
                      ) : (
                        <Button
                          className="h-10 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
                          disabled={isSubmitting}
                          onClick={handleOpenApproveDialog}
                          type="button"
                        >
                          <Check className="mr-1.5 size-4" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </section>
                ) : null}

                {canCancel &&
                  application &&
                  (application.status === 'PENDING' ||
                    application.status === 'SUBMITTED') ? (
                  <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Actions
                    </p>
                    <div className="mt-3">
                      <Button
                        className="h-10 w-full rounded-[4px] border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
                        disabled={isSubmitting}
                        onClick={() => setCancelDialogOpen(true)}
                        type="button"
                        variant="outline"
                      >
                        <X className="mr-1.5 size-4" />
                        Cancel Request
                      </Button>
                    </div>
                  </section>
                ) : null}
              </div>
              <AlertDialog
                open={pendingDeleteCommentId !== null}
                onOpenChange={(open) => {
                  if (!open && deletingCommentId === null) {
                    setPendingDeleteCommentId(null);
                  }
                }}
              >
                <AlertDialogContent className="border border-[#39424f] bg-[#151c25] text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black text-white">
                      Delete comment?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium text-[#aeb7c2]">
                      This comment will be removed from the review discussion.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="border-[#303842] bg-[#101820] text-white hover:bg-[#151c25]"
                      disabled={deletingCommentId !== null}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[#6b2637] text-white hover:bg-[#4a1d2c]"
                      disabled={deletingCommentId !== null}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pendingDeleteCommentId) {
                          void handleDeleteComment(pendingDeleteCommentId);
                        }
                      }}
                    >
                      {deletingCommentId !== null ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog onOpenChange={setRejectDialogOpen} open={rejectDialogOpen}>
        <DialogContent
          className="max-w-lg gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
          showCloseButton
        >
          <DialogHeader className="border-b border-[#303842] px-6 py-5">
            <DialogTitle className="text-xl font-black text-white">
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
              Add a reason so the submitter knows what needs to change.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Rejection Reason *
              </span>
              <textarea
                className="mt-2 h-32 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
                onChange={(event) => setDraftRejectReason(event.target.value)}
                placeholder="Explain what should be revised before resubmission..."
                value={draftRejectReason}
              />
            </label>

          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
              onClick={() => setRejectDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="h-9 rounded-[4px] bg-[#ff9ab3] px-4 text-xs font-black text-[#2b111a] hover:bg-[#ff86a6]"
              disabled={!canConfirmReject}
              onClick={handleConfirmReject}
              type="button"
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setApproveDialogOpen} open={approveDialogOpen}>
        <DialogContent
          className="max-w-md gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
          showCloseButton={false}
        >
          <DialogHeader className="border-b border-[#39424f] px-6 py-5">
            <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-[#ffd35b]/30 bg-[#30270d] text-[#ffd35b]">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-black text-white">
              {application?.status === 'PENDING' ? 'Submit to Board' : 'Approve Application'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium leading-5 text-[#aeb7c2]">
              {application?.status === 'PENDING'
                ? 'Are you sure you want to submit this application to the editorial board? The board will be notified to review and vote.'
                : 'Are you sure you want to approve this application?'}
            </DialogDescription>

          </DialogHeader>

          <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
              onClick={() => setApproveDialogOpen(false)}
              type="button"
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
              disabled={isSubmitting}
              onClick={() => {
                if (application) {
                  onUpdateStatus(
                    application,
                    application.status === 'PENDING' ? 'SUBMITTED' : 'APPROVE',
                    undefined
                  );
                  setApproveDialogOpen(false);
                }
              }}
              type="button"
            >
              {isSubmitting ? 'Processing...' : (application?.status === 'PENDING' ? 'Submit to Board' : 'Confirm Approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setCancelDialogOpen} open={cancelDialogOpen}>
        <DialogContent
          className="max-w-md gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
          showCloseButton={false}
        >
          <DialogHeader className="border-b border-[#39424f] px-6 py-5">
            <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-red-500/30 bg-red-950/20 text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-xl font-black text-white">Cancel Request</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
              Are you sure you want to cancel this request? This action will stop the review process and mark it as cancelled.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
              onClick={() => setCancelDialogOpen(false)}
              type="button"
              variant="outline"
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button
              className="h-9 rounded-[4px] bg-red-600 px-4 text-xs font-black text-white hover:bg-red-700"
              disabled={isSubmitting}
              onClick={() => {
                if (application) {
                  onUpdateStatus(application, 'CANCELLED');
                  setCancelDialogOpen(false);
                }
              }}
              type="button"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
