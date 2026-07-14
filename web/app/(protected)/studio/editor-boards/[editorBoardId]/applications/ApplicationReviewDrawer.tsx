'use client';

import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  FileUp,
  Loader2,
  UserCircle,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import { useRealtimeComments } from '@/hooks/use-realtime-activity';
import { useAuth } from '@/hooks/useAuth';
import {
  getApplicationVotes,
  updateApplicationVoteDeadline,
  voteApplication,
  type ApplicationStatus,
  type ApplicationVoteResponse,
  type VoteDecision,
} from '@/services/application.service';

import type { EditorBoardApplicationResponse } from './ApplicationsClient';
import { getEditorBoardApiErrorMessage } from '../../utils/api-error';
import {
  getApplicationTypeLabel,
  getStatusLabel,
  getStatusStyle,
  isBoardReviewableStatus,
} from './application-ui';
import {
  createApplicationComment,
  getApplicationComments,
  type ApplicationCommentResponse,
} from './services/application-comments-service';

type CommentItem = ApplicationCommentResponse;

type ApplicationReviewDrawerProps = {
  application: EditorBoardApplicationResponse | null;
  canApprove: boolean;
  canManageVoteDeadline: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onVoteDeadlineChange: (application: EditorBoardApplicationResponse) => void;
  onUpdateStatus: (application: EditorBoardApplicationResponse, status: ApplicationStatus) => void;
};

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDateTimeInputValue(date: Date) {
  return toDateTimeLocalValue(date.toISOString());
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));
const COMMENT_PAGE_SIZE = 10;
const DEFAULT_DRAWER_WIDTH = 720;
const MIN_DRAWER_WIDTH = 560;
const MAX_DRAWER_WIDTH = 1040;

type CommentPagination = {
  page: number;
  total: number;
  totalPages: number;
};

type ReviewSectionProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  meta?: ReactNode;
  title: string;
};

function ReviewSection({ children, defaultOpen = false, meta, title }: ReviewSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25]">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1b2430]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex items-center min-w-0 gap-2">
          {isOpen ? (
            <ChevronDown className="size-4 shrink-0 text-[#FFD369]" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-[#8b94a1]" />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
            {title}
          </span>
        </span>
        {meta ? <span className="shrink-0">{meta}</span> : null}
      </button>
      {isOpen ? <div className="border-t border-[#303842] p-4">{children}</div> : null}
    </section>
  );
}

type UploadedApplicationFile = {
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  type?: string;
  url?: string;
};

function readUploadedFiles(materials: unknown) {
  if (Array.isArray(materials)) {
    return materials.map((material) => {
      const item = material as {
        mimeType?: string;
        originalName?: string;
        size?: number;
        type?: string;
        url?: string;
      };

      return {
        mimeType: item.mimeType,
        name: item.originalName ?? item.url ?? 'Uploaded material',
        sizeBytes: item.size,
        type: item.type,
        url: item.url,
      } satisfies UploadedApplicationFile;
    });
  }

  if (
    !materials ||
    typeof materials !== 'object' ||
    !('uploadedFiles' in materials) ||
    !Array.isArray(materials.uploadedFiles)
  ) {
    return [];
  }

  return materials.uploadedFiles as Array<{
    name: string;
    mimeType: string;
    sizeBytes: number;
    lastModified: number;
  }>;
}

// PhucTD #editor-board start
export function ApplicationReviewDrawer({
  application,
  canApprove,
  canManageVoteDeadline,
  isSubmitting,
  onOpenChange,
  onVoteDeadlineChange,
  onUpdateStatus,
}: ApplicationReviewDrawerProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<ApplicationVoteResponse[]>([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteComment, setVoteComment] = useState('');
  const [localVoteDeadline, setLocalVoteDeadline] = useState<string | null>(null);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentPagination, setCommentPagination] = useState<CommentPagination | null>(null);
  const [commentsError, setCommentsError] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderCommentsRef = useRef(false);
  const shouldScrollCommentsToBottomRef = useRef(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const { createdComments } = useRealtimeComments('APPLICATION', application?.id);

  useEffect(() => {
    if (!isResizingDrawer) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const maxWidth = Math.min(MAX_DRAWER_WIDTH, window.innerWidth - 24);
      const nextWidth = Math.min(
        maxWidth,
        Math.max(MIN_DRAWER_WIDTH, window.innerWidth - event.clientX),
      );

      setDrawerWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizingDrawer(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingDrawer]);

  const mergeComment = useCallback((comment: CommentItem) => {
    setComments((currentComments) => {
      const exists = currentComments.some((currentComment) => currentComment.id === comment.id);
      if (exists) {
        return currentComments.map((currentComment) =>
          currentComment.id === comment.id ? comment : currentComment,
        );
      }

      return [...currentComments, comment].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
      );
    });
  }, []);

  const normalizeComments = useCallback((incomingComments: CommentItem[]) => {
    const commentsById = new Map<number, CommentItem>();

    incomingComments.forEach((comment) => {
      commentsById.set(comment.id, comment);
    });

    return Array.from(commentsById.values()).sort(
      (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
    );
  }, []);

  const handleSendComment = async () => {
    if (!application) return;
    if (!newComment.trim()) return;

    setIsSendingComment(true);
    setCommentsError('');

    try {
      const comment = await createApplicationComment(application.id, newComment.trim());
      if (comment) {
        shouldScrollCommentsToBottomRef.current = true;
        mergeComment(comment);
      }
      setNewComment('');
    } catch {
      setCommentsError('Unable to send comment.');
    } finally {
      setIsSendingComment(false);
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

  const getCommentText = (content: CommentItem['content']) => {
    if (!content) {
      return '';
    }

    if (typeof content === 'string') {
      return content;
    }

    return content.text ?? '';
  };

  const loadVotes = async (id: number) => {
    setIsLoadingVotes(true);
    try {
      const data = await getApplicationVotes(id);
      setVotes(data);
    } catch {
      setVotes([]);
    } finally {
      setIsLoadingVotes(false);
    }
  };

  useEffect(() => {
    if (application?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadVotes(application.id);
      setLocalVoteDeadline(application.voteDeadline ?? null);
      setDeadlineInput(toDateTimeLocalValue(application.voteDeadline));
      setDeadlineError(null);
    }
  }, [application?.id, application?.voteDeadline]);

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
        const result = await getApplicationComments(applicationId, {
          limit: COMMENT_PAGE_SIZE,
          page: 1,
        });
        if (isMounted) {
          setComments(normalizeComments(result.comments));
          setCommentPagination(
            result.pagination
              ? {
                  page: result.pagination.page,
                  total: result.pagination.total,
                  totalPages: result.pagination.totalPages,
                }
              : null,
          );
          window.requestAnimationFrame(() => {
            const scrollElement = commentsScrollRef.current;
            if (scrollElement) {
              scrollElement.scrollTop = scrollElement.scrollHeight;
            }
          });
        }
      } catch {
        if (isMounted) {
          setComments([]);
          setCommentPagination(null);
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
    const newestComment = createdComments.at(-1) as CommentItem | undefined;
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
    if (!shouldScrollCommentsToBottomRef.current || isLoadingComments) {
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
  }, [comments.length, isLoadingComments]);

  const loadOlderComments = async () => {
    if (!application?.id || isLoadingOlderCommentsRef.current || !commentPagination) {
      return;
    }

    if (commentPagination.page >= commentPagination.totalPages) {
      return;
    }

    const scrollElement = commentsScrollRef.current;
    const previousScrollHeight = scrollElement?.scrollHeight ?? 0;

    isLoadingOlderCommentsRef.current = true;
    setIsLoadingOlderComments(true);
    setCommentsError('');

    try {
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
            }
          : commentPagination,
      );

      window.requestAnimationFrame(() => {
        const currentScrollElement = commentsScrollRef.current;
        if (currentScrollElement) {
          currentScrollElement.scrollTop =
            currentScrollElement.scrollHeight -
            previousScrollHeight +
            currentScrollElement.scrollTop;
        }
      });
    } catch {
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

  const handleVote = async (decision: VoteDecision) => {
    if (!application) return;
    setIsVoting(true);
    setVoteError(null);
    try {
      await voteApplication(application.id, { decision, comment: voteComment });
      await loadVotes(application.id);
      setVoteComment('');
    } catch {
      setVoteError('Unable to submit your vote.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSaveDeadline = async () => {
    if (!application || !deadlineInput) {
      return;
    }

    setIsSavingDeadline(true);
    setDeadlineError(null);

    try {
      const deadlineIso = new Date(deadlineInput).toISOString();
      const updatedApplication = await updateApplicationVoteDeadline(application.id, deadlineIso);
      const nextApplication = {
        ...application,
        ...updatedApplication,
        voteDeadline: updatedApplication?.voteDeadline ?? deadlineIso,
      } satisfies EditorBoardApplicationResponse;

      setLocalVoteDeadline(nextApplication.voteDeadline);
      setDeadlineInput(toDateTimeLocalValue(nextApplication.voteDeadline));
      onVoteDeadlineChange(nextApplication);
      setIsDeadlinePickerOpen(false);
    } catch (error) {
      setDeadlineError(getEditorBoardApiErrorMessage(error, 'Unable to update vote deadline.'));
    } finally {
      setIsSavingDeadline(false);
    }
  };

  const selectedDeadlineDate = deadlineInput ? new Date(deadlineInput) : undefined;
  const selectedDeadlineHour =
    selectedDeadlineDate && !Number.isNaN(selectedDeadlineDate.getTime())
      ? String(selectedDeadlineDate.getHours()).padStart(2, '0')
      : '18';
  const selectedDeadlineMinute =
    selectedDeadlineDate && !Number.isNaN(selectedDeadlineDate.getTime())
      ? String(Math.floor(selectedDeadlineDate.getMinutes() / 5) * 5).padStart(2, '0')
      : '00';

  const updateDeadlineDate = (date?: Date) => {
    if (!date) {
      return;
    }

    const nextDate = new Date(date);
    nextDate.setHours(Number(selectedDeadlineHour), Number(selectedDeadlineMinute), 0, 0);
    setDeadlineInput(getDateTimeInputValue(nextDate));
  };

  const updateDeadlineTime = (hour: string, minute: string) => {
    const nextDate =
      selectedDeadlineDate && !Number.isNaN(selectedDeadlineDate.getTime())
        ? new Date(selectedDeadlineDate)
        : new Date();

    nextDate.setHours(Number(hour), Number(minute), 0, 0);
    setDeadlineInput(getDateTimeInputValue(nextDate));
  };

  const uploadedFiles = application ? readUploadedFiles(application.materials) : [];

  const submittedBy =
    application?.createdByUser?.displayName ??
    application?.createdByUser?.email ??
    (application?.createdBy ? `User #${application.createdBy}` : 'Unknown user');

  const reviewedBy =
    application?.verifiedByUser?.displayName ??
    application?.verifiedByUser?.email ??
    (application?.verifyBy ? `User #${application.verifyBy}` : null);

  const currentVoteDeadline = localVoteDeadline ?? application?.voteDeadline ?? null;
  const isReviewable = application ? isBoardReviewableStatus(application.status) : false;
  const hasVoteDeadlinePassed = currentVoteDeadline
    ? new Date() > new Date(currentVoteDeadline)
    : false;
  const isVoteable = isReviewable && !!currentVoteDeadline && !hasVoteDeadlinePassed;
  const canShowReviewActions = canApprove && isReviewable && hasVoteDeadlinePassed;

  const approveVotesCount = votes.filter((v) => v.decision === 'APPROVE').length;
  const rejectVotesCount = votes.filter((v) => v.decision === 'REJECT').length;
  const abstainVotesCount = votes.filter((v) => v.decision === 'ABSTAIN').length;
  const hasVoted = user && votes.some((v) => v.userId === user.id);
  const visibleComments = Array.isArray(comments) ? comments : [];

  return (
    <Sheet
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setVotes([]);
          setVoteError(null);
          setVoteComment('');
          setLocalVoteDeadline(null);
          setDeadlineInput('');
          setDeadlineError(null);
          setIsDeadlinePickerOpen(false);
          setComments([]);
          setCommentPagination(null);
          isLoadingOlderCommentsRef.current = false;
          setIsLoadingOlderComments(false);
          setNewComment('');
        }
      }}
      open={Boolean(application)}
    >
      <SheetContent
        className="gap-0 border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
        side="right"
        style={{ maxWidth: 'calc(100vw - 24px)', width: drawerWidth }}
      >
        {application ? (
          <>
            <button
              aria-label="Resize review drawer"
              className="absolute left-0 top-0 z-20 h-full w-2 cursor-col-resize border-l border-[#FFD369]/0 transition-colors hover:border-[#FFD369]/70"
              onMouseDown={(event) => {
                event.preventDefault();
                setIsResizingDrawer(true);
              }}
              type="button"
            />
            <SheetHeader className="relative border-b border-[#303842] px-5 py-5">
              <button
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-[4px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-start justify-between gap-4 pr-10">
                <div className="min-w-0">
                  <SheetTitle className="text-xl font-black text-white">
                    {application.title}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs font-bold text-[#aeb7c2]">
                    Submitted {new Date(application.createdAt).toLocaleDateString()}
                  </SheetDescription>
                </div>
                <Badge
                  className={`mt-0.5 h-7 shrink-0 rounded-full border px-3 text-[11px] font-bold ${getStatusStyle(application.status)}`}
                  variant="outline"
                >
                  {getStatusLabel(application.status)}
                </Badge>
              </div>
              {isReviewable ? (
                <div className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#FFD369]">
                        <CalendarClock className="size-3.5" />
                        Vote Deadline
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#dce7f3]">
                        {formatDateTime(currentVoteDeadline)}
                      </p>
                    </div>
                    {currentVoteDeadline ? (
                      <Badge
                        className={`h-6 rounded-full px-2 text-[10px] font-black ${
                          hasVoteDeadlinePassed
                            ? 'border-[#6b2637] bg-[#371522] text-[#ff9ab3]'
                            : 'border-[#315846] bg-[#14291f] text-[#9df2c7]'
                        }`}
                        variant="outline"
                      >
                        {hasVoteDeadlinePassed ? 'Closed' : 'Open'}
                      </Badge>
                    ) : null}
                  </div>
                  {canManageVoteDeadline ? (
                    <div className="mt-3 grid gap-2">
                      <Popover onOpenChange={setIsDeadlinePickerOpen} open={isDeadlinePickerOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className="flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[4px] border border-[#303842] bg-[#101820] px-3 text-left text-xs font-bold text-white transition-colors hover:border-[#FFD369]/70 hover:bg-[#17202b]"
                            disabled={isSavingDeadline}
                            type="button"
                          >
                            <span className="flex items-center min-w-0 gap-2">
                              <CalendarClock className="size-4 shrink-0 text-[#FFD369]" />
                              <span className="truncate">
                                {deadlineInput
                                  ? formatDateTime(new Date(deadlineInput).toISOString())
                                  : 'Select date and time'}
                              </span>
                            </span>
                            <ChevronDown className="size-4 shrink-0 text-[#8b94a1]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-[330px] border-[#39424f] bg-[#151c25] p-3 text-white shadow-xl"
                          side="left"
                          sideOffset={8}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#303842] pb-3">
                            <div>
                              <p className="text-xs font-black text-white">Voting deadline</p>
                              <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                                Pick a date, then set the closing time.
                              </p>
                            </div>
                            <Badge
                              className="h-6 rounded-full border-[#39424f] bg-[#101820] text-[10px] font-black text-[#FFD369]"
                              variant="outline"
                            >
                              {selectedDeadlineHour}:{selectedDeadlineMinute}
                            </Badge>
                          </div>
                          <Calendar
                            buttonVariant="ghost"
                            className="mx-auto rounded-[4px] bg-transparent text-white"
                            classNames={{
                              caption_label: 'text-sm font-black text-white',
                              day: 'text-white',
                              disabled: 'text-[#4b535f] opacity-40',
                              nav: 'text-white',
                              outside: 'text-[#4b535f]',
                              today: 'bg-[#26303b] text-[#FFD369]',
                              weekday: 'text-[#8b94a1] text-[11px] font-bold',
                            }}
                            defaultMonth={
                              selectedDeadlineDate && !Number.isNaN(selectedDeadlineDate.getTime())
                                ? selectedDeadlineDate
                                : undefined
                            }
                            disabled={{ before: getStartOfToday() }}
                            mode="single"
                            onSelect={updateDeadlineDate}
                            selected={
                              selectedDeadlineDate && !Number.isNaN(selectedDeadlineDate.getTime())
                                ? selectedDeadlineDate
                                : undefined
                            }
                          />
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#303842] pt-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                              Hour
                              <select
                                className="mt-1 h-9 w-full rounded-[4px] border border-[#303842] bg-[#101820] px-2 text-xs font-bold text-white outline-none focus:border-[#FFD369]"
                                onChange={(event) =>
                                  updateDeadlineTime(event.target.value, selectedDeadlineMinute)
                                }
                                value={selectedDeadlineHour}
                              >
                                {HOUR_OPTIONS.map((hour) => (
                                  <option key={hour} value={hour}>
                                    {hour}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                              Minute
                              <select
                                className="mt-1 h-9 w-full rounded-[4px] border border-[#303842] bg-[#101820] px-2 text-xs font-bold text-white outline-none focus:border-[#FFD369]"
                                onChange={(event) =>
                                  updateDeadlineTime(selectedDeadlineHour, event.target.value)
                                }
                                value={selectedDeadlineMinute}
                              >
                                {MINUTE_OPTIONS.map((minute) => (
                                  <option key={minute} value={minute}>
                                    {minute}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-3">
                            <p className="min-w-0 truncate text-[11px] font-bold text-[#aeb7c2]">
                              {deadlineInput
                                ? formatDateTime(new Date(deadlineInput).toISOString())
                                : 'No deadline selected'}
                            </p>
                            <Button
                              className="h-8 rounded-[4px] bg-[#FFD369] px-3 text-[11px] font-black text-[#222831] hover:bg-[#eac04f]"
                              disabled={!deadlineInput || isSavingDeadline}
                              onClick={handleSaveDeadline}
                              type="button"
                            >
                              {isSavingDeadline ? 'Saving...' : 'Done'}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : null}
                  {deadlineError ? (
                    <p className="mt-2 text-[11px] font-bold text-[#ff9ab3]">{deadlineError}</p>
                  ) : null}
                </div>
              ) : null}
            </SheetHeader>

            <div className="no-scrollbar flex-1 h-full min-h-0 px-5 py-5 pb-20 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Project
                  </p>
                  <p className="mt-3 text-sm font-black text-white truncate">
                    {application.project?.name || 'Unknown'}
                  </p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Submitted By
                  </p>
                  <p className="mt-3 text-sm font-black text-white truncate">{submittedBy}</p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Submitted At
                  </p>
                  <p className="mt-3 text-sm font-black text-white">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Reviewed By
                  </p>
                  <p className="mt-3 text-sm font-black text-white truncate">
                    {reviewedBy ?? (isReviewable ? 'Not reviewed yet' : 'Unknown reviewer')}
                  </p>
                </article>
              </div>

              <ReviewSection
                defaultOpen
                meta={
                  <Badge
                    className="h-6 rounded-full border border-[#39424f] bg-[#1a222d] px-2 text-[10px] font-bold text-[#dce7f3]"
                    variant="outline"
                  >
                    {getApplicationTypeLabel(application.type)}
                  </Badge>
                }
                title="Request Type"
              >
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm font-black text-white">
                    {getApplicationTypeLabel(application.type)}
                  </p>
                  {currentVoteDeadline && (
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#FFD369]">
                        Vote Deadline
                      </p>
                      <p className="text-sm font-black text-white">
                        {formatDateTime(currentVoteDeadline)}
                      </p>
                    </div>
                  )}
                </div>
              </ReviewSection>

              <ReviewSection defaultOpen title="Description">
                <p className="mt-3 text-sm font-medium leading-6 text-[#dce7f3]">
                  {application.description ?? 'No description provided.'}
                </p>
              </ReviewSection>

              <ReviewSection
                meta={
                  <span className="text-[10px] font-black uppercase text-[#8b94a1]">
                    {uploadedFiles.length}
                  </span>
                }
                title="Uploaded Files"
              >
                <div className="mt-3 space-y-2">
                  {uploadedFiles.length ? (
                    uploadedFiles.map((file) => (
                      <div
                        className="flex min-h-12 items-center gap-3 rounded-[3px] border border-[#303842] bg-[#101820] px-3 py-2"
                        key={`${file.name}-${file.sizeBytes ?? 'unknown'}`}
                      >
                        <FileUp className="size-4 shrink-0 text-[#FFD369]" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{file.name}</p>
                          <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                            {file.mimeType ?? 'Unknown type'} - {formatFileSize(file.sizeBytes)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-[#aeb7c2]">No uploaded files.</p>
                  )}
                </div>
              </ReviewSection>

              <ReviewSection title="Activity">
                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <span className="mt-1 size-2 rounded-full bg-[#FFD369]" />
                    <div>
                      <p className="text-xs font-black text-white">Submitted</p>
                      <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                        {submittedBy} submitted this request on{' '}
                        {new Date(application.createdAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                  {isReviewable ? (
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
                        className={`mt-1 size-2 rounded-full ${
                          application.status === 'APPROVE' ? 'bg-[#9df2c7]' : 'bg-[#ff9ab3]'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-black text-white">
                          {getStatusLabel(application.status)}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                          {reviewedBy ?? 'Reviewer'} updated this request on{' '}
                          {new Date(application.updatedAt).toLocaleDateString()}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ReviewSection>

              <ReviewSection
                defaultOpen
                meta={
                  <span className="text-[10px] font-black uppercase text-[#8b94a1]">
                    {votes.length} votes
                  </span>
                }
                title="Team Votes"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <article className="rounded-[4px] border border-[#315846] bg-[#14291f] px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#9df2c7]">
                      Approve
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">{approveVotesCount}</p>
                  </article>
                  <article className="rounded-[4px] border border-[#6b2637] bg-[#371522] px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#ff9ab3]">
                      Reject
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">{rejectVotesCount}</p>
                  </article>
                  <article className="rounded-[4px] border border-[#39424f] bg-[#101820] px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                      Abstain
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">{abstainVotesCount}</p>
                  </article>
                </div>
                <div className="mt-3 rounded-[4px] border border-[#303842] bg-[#101820] px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-[#aeb7c2]">Deadline</span>
                    <span className={hasVoteDeadlinePassed ? 'text-[#ff9ab3]' : 'text-[#FFD369]'}>
                      {currentVoteDeadline
                        ? `${formatDateTime(currentVoteDeadline)} - ${
                            hasVoteDeadlinePassed ? 'closed' : 'open'
                          }`
                        : 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {isLoadingVotes ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div className="flex gap-3 rounded-[4px] bg-[#101820] p-3" key={index}>
                        <div className="size-9 shrink-0 animate-pulse rounded-full bg-[#1f2937]" />
                        <div className="flex-1 min-w-0">
                          <div className="h-3 w-40 animate-pulse rounded-[4px] bg-[#26303b]" />
                          <div className="mt-2 h-3 w-full animate-pulse rounded-[4px] bg-[#1f2937]" />
                        </div>
                      </div>
                    ))
                  ) : votes.length ? (
                    votes.map((vote) => (
                      <div
                        className="flex gap-3 rounded-[4px] border border-[#303842] bg-[#101820] p-3"
                        key={vote.userId}
                      >
                        {vote.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={vote.user.avatarUrl}
                            alt="Avatar"
                            className="rounded-full size-8"
                          />
                        ) : (
                          <UserCircle className="size-8 text-[#8b94a1]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-white">
                              {vote.user.displayName || vote.user.email || `User #${vote.userId}`}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                                vote.decision === 'APPROVE'
                                  ? 'bg-[#14291f] text-[#9df2c7]'
                                  : vote.decision === 'REJECT'
                                    ? 'bg-[#371522] text-[#ff9ab3]'
                                    : 'bg-[#202832] text-[#aeb7c2]'
                              }`}
                            >
                              {vote.decision}
                            </span>
                          </div>
                          {vote.comment && (
                            <p className="mt-1 text-xs font-medium text-[#dce7f3]">
                              {vote.comment}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] font-bold text-[#4b535f]">
                            {new Date(vote.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-[#8b94a1]">No votes casted yet.</p>
                  )}
                </div>

                {isReviewable && !currentVoteDeadline ? (
                  <div className="mt-4 border-t border-[#303842] pt-4">
                    <p className="text-xs font-bold text-[#ff9ab3]">
                      Voting cannot start until a deadline is set by a board leader.
                    </p>
                  </div>
                ) : isVoteable ? (
                  <div className="mt-4 border-t border-[#303842] pt-4">
                    <p className="mb-2 text-xs font-black text-white">
                      {hasVoted ? 'Update Your Vote' : 'Your Vote'}
                    </p>
                    {voteError ? (
                      <p className="mb-2 text-[11px] font-bold text-[#ff9ab3]">{voteError}</p>
                    ) : null}
                    <Textarea
                      placeholder="Add an optional comment..."
                      className="min-h-16 resize-none border-[#303842] bg-[#101820] text-xs font-medium text-white placeholder:text-[#4b535f] focus-visible:ring-[#FFD369]"
                      value={voteComment}
                      onChange={(e) => setVoteComment(e.target.value)}
                      disabled={isVoting}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        className="h-8 flex-1 rounded-[4px] bg-[#222a34] text-[11px] font-black text-[#dce7f3] hover:bg-[#303842]"
                        disabled={isVoting}
                        onClick={() => handleVote('ABSTAIN')}
                      >
                        Abstain
                      </Button>
                      <Button
                        className="h-8 flex-1 rounded-[4px] border-[#6b2637] bg-[#371522] text-[11px] font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
                        disabled={isVoting}
                        onClick={() => handleVote('REJECT')}
                        variant="outline"
                      >
                        <X className="mr-1.5 size-3" />
                        Reject
                      </Button>
                      <Button
                        className="h-8 flex-1 rounded-[4px] bg-[#14291f] text-[11px] font-black text-[#9df2c7] hover:bg-[#1b3628]"
                        disabled={isVoting}
                        onClick={() => handleVote('APPROVE')}
                      >
                        <Check className="mr-1.5 size-3" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ) : null}
              </ReviewSection>

              <ReviewSection
                defaultOpen
                meta={
                  <span className="text-[10px] font-black uppercase text-[#8b94a1]">
                    {visibleComments.length}
                  </span>
                }
                title="Comments"
              >
                <div className="flex flex-col">
                  {commentsError ? (
                    <p className="mb-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-3 py-2 text-xs font-bold text-red-300">
                      {commentsError}
                    </p>
                  ) : null}

                  {isLoadingComments ? (
                    <p className="mb-4 text-xs font-bold text-[#8b94a1]">Loading comments...</p>
                  ) : visibleComments.length === 0 ? (
                    <p className="text-xs font-bold text-[#8b94a1] mb-4">
                      No comments yet. Start the discussion!
                    </p>
                  ) : (
                    <div
                      ref={commentsScrollRef}
                      className="no-scrollbar mb-4 max-h-80 space-y-3 overflow-y-auto pr-1"
                      onScroll={handleCommentsScroll}
                    >
                      {isLoadingOlderComments ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="size-4 animate-spin text-[#FFD369]" />
                        </div>
                      ) : null}
                      {visibleComments.map((comment) => {
                        const isCurrentUserComment = comment.createdByUser?.id === user?.id;
                        const commentText = getCommentText(comment.content);

                        return (
                          <div
                            className={`flex gap-3 rounded-[4px] border p-3 ${
                              isCurrentUserComment
                                ? 'border-[#FFD369]/35 bg-[#1d2630]'
                                : 'border-transparent bg-[#101820]'
                            }`}
                            key={comment.id}
                          >
                            {comment.createdByUser?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={comment.createdByUser.avatarUrl}
                                alt="Avatar"
                                className="rounded-full size-8 shrink-0"
                              />
                            ) : (
                              <UserCircle className="size-8 text-[#8b94a1] shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
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
                              <p
                                className={`mt-1 text-xs text-[#dce7f3] ${
                                  isCurrentUserComment ? 'font-semibold' : 'font-medium'
                                }`}
                              >
                                {renderCommentText(commentText)}
                              </p>
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
                    <div className="flex justify-end mt-3">
                      <Button
                        className="h-8 rounded-[4px] bg-[#FFD369] px-4 text-[11px] font-black text-[#222831] hover:bg-[#eac04f]"
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || isSendingComment}
                      >
                        <Check className="mr-1.5 size-3" />
                        {isSendingComment ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              </ReviewSection>

              {canShowReviewActions ? (
                <ReviewSection defaultOpen title="Review Actions">
                  <p className="text-xs font-bold leading-5 text-[#aeb7c2]">
                    Voting deadline has passed. The board lead can now confirm the final decision.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Button
                      className="h-10 rounded-[4px] border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
                      disabled={isSubmitting}
                      onClick={() => onUpdateStatus(application, 'REJECT')}
                      type="button"
                      variant="outline"
                    >
                      <X className="mr-1.5 size-4" />
                      Reject
                    </Button>
                    <Button
                      className="h-10 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
                      disabled={isSubmitting}
                      onClick={() => onUpdateStatus(application, 'APPROVE')}
                      type="button"
                    >
                      <Check className="mr-1.5 size-4" />
                      Approve
                    </Button>
                  </div>
                </ReviewSection>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
// PhucTD #editor-board end
