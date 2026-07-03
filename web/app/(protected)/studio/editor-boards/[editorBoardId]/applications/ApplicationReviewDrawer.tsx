'use client';

import { Check, FileUp, X, UserCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '@/hooks/useAuth';
import {
  getApplicationVotes,
  voteApplication,
  type ApplicationStatus,
  type ApplicationVoteResponse,
  type VoteDecision,
} from '@/services/application.service';

import type { EditorBoardApplicationResponse } from './ApplicationsClient';
import {
  getApplicationTypeLabel,
  getStatusLabel,
  getStatusStyle,
  isBoardReviewableStatus,
} from './application-ui';

type CommentItem = {
  id: number;
  content: { text: string };
  createdByUser?: {
    id: number;
    email?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
};

const MOCK_COMMENTS: CommentItem[] = [
  {
    id: 1,
    content: { text: 'Bản thảo chương này cần chỉnh lại bố cục trang 3 và trang 7, phần panel chưa cân đối.' },
    createdByUser: { id: 1, displayName: 'Minh Tran', avatarUrl: null, email: 'minh@example.com' },
    createdAt: '2026-06-28T10:30:00.000Z',
  },
  {
    id: 2,
    content: { text: '@Minh Tran Đã note lại, tôi sẽ chỉnh panel trang 3. Trang 7 thì giữ nguyên được không?' },
    createdByUser: { id: 2, displayName: 'Phuc Le', avatarUrl: null, email: 'phuc@example.com' },
    createdAt: '2026-06-28T11:15:00.000Z',
  },
  {
    id: 3,
    content: { text: '@Phuc Le Trang 7 cũng cần sửa, vì kích thước frame không đồng nhất với các trang trước.' },
    createdByUser: { id: 1, displayName: 'Minh Tran', avatarUrl: null, email: 'minh@example.com' },
    createdAt: '2026-06-28T14:00:00.000Z',
  },
  {
    id: 4,
    content: { text: 'Phần dialog ở trang 5 khá tốt, giữ nguyên nhé.' },
    createdByUser: { id: 3, displayName: 'Huong Nguyen', avatarUrl: null, email: 'huong@example.com' },
    createdAt: '2026-06-29T09:00:00.000Z',
  },
  {
    id: 5,
    content: { text: '@Huong Nguyen Cảm ơn chị, em sẽ giữ nguyên phần đó.' },
    createdByUser: { id: 2, displayName: 'Phuc Le', avatarUrl: null, email: 'phuc@example.com' },
    createdAt: '2026-06-29T09:30:00.000Z',
  },
];

type ApplicationReviewDrawerProps = {
  application: EditorBoardApplicationResponse | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (
    application: EditorBoardApplicationResponse,
    status: ApplicationStatus,
  ) => void;
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
  isSubmitting,
  onOpenChange,
  onUpdateStatus,
}: ApplicationReviewDrawerProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<ApplicationVoteResponse[]>([]);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteComment, setVoteComment] = useState('');
  
  const [comments, setComments] = useState<CommentItem[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleReply = (displayName: string | null | undefined) => {
    if (displayName) {
      setNewComment(`@${displayName} `);
      commentInputRef.current?.focus();
    }
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    
    const nextId = comments.length ? Math.max(...comments.map(c => c.id)) + 1 : 1;
    const comment: CommentItem = {
      id: nextId,
      content: { text: newComment },
      createdByUser: user ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      } : null,
      createdAt: new Date().toISOString(),
    };
    
    setComments([...comments, comment]);
    setNewComment('');
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
    }
  }, [application?.id]);

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

  const uploadedFiles = application ? readUploadedFiles(application.materials) : [];
  
  const submittedBy =
    application?.createdByUser?.displayName ??
    application?.createdByUser?.email ??
    (application?.createdBy ? `User #${application.createdBy}` : 'Unknown user');

  const reviewedBy =
    application?.verifiedByUser?.displayName ??
    application?.verifiedByUser?.email ??
    (application?.verifyBy ? `User #${application.verifyBy}` : null);

  const canApprove = true;
  const isReviewable = application ? isBoardReviewableStatus(application.status) : false;

  const approveVotesCount = votes.filter(v => v.decision === 'APPROVE').length;
  const rejectVotesCount = votes.filter(v => v.decision === 'REJECT').length;
  const abstainVotesCount = votes.filter(v => v.decision === 'ABSTAIN').length;
  const hasVoted = user && votes.some((v) => v.userId === user.id);

  return (
    <Sheet onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setVotes([]);
        setVoteError(null);
        setVoteComment('');
        setComments(MOCK_COMMENTS);
        setNewComment('');
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
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 h-full pb-20">
              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Project
                  </p>
                  <p className="mt-3 truncate text-sm font-black text-white">
                    {application.project?.name || 'Unknown'}
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
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Reviewed By
                  </p>
                  <p className="mt-3 truncate text-sm font-black text-white">
                    {reviewedBy ?? (isReviewable ? 'Not reviewed yet' : 'Unknown reviewer')}
                  </p>
                </article>
              </div>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Request Type
                </p>
                <p className="mt-3 text-sm font-black text-white">
                  {getApplicationTypeLabel(application.type)}
                </p>
              </section>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Description
                </p>
                <p className="mt-3 text-sm font-medium leading-6 text-[#dce7f3]">
                  {application.description ?? 'No description provided.'}
                </p>
              </section>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Uploaded Files
                </p>
                <div className="mt-3 space-y-2">
                  {uploadedFiles.length ? (
                    uploadedFiles.map((file) => (
                      <div
                        className="flex min-h-12 items-center gap-3 rounded-[3px] border border-[#303842] bg-[#101820] px-3 py-2"
                        key={`${file.name}-${file.sizeBytes ?? 'unknown'}`}
                      >
                        <FileUp className="size-4 shrink-0 text-[#FFD369]" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-white">{file.name}</p>
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
                        {submittedBy} submitted this request on {new Date(application.createdAt).toLocaleDateString()}.
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
              </section>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Team Votes
                  </p>
                  <div className="flex gap-3 text-xs font-bold text-[#aeb7c2]">
                    <span className="text-[#9df2c7]">{approveVotesCount} Approve</span>
                    <span className="text-[#ff9ab3]">{rejectVotesCount} Reject</span>
                    <span>{abstainVotesCount} Abstain</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {isLoadingVotes ? (
                    <p className="text-xs font-bold text-[#8b94a1]">Loading votes...</p>
                  ) : votes.length ? (
                    votes.map((vote) => (
                      <div className="flex gap-3 rounded-[4px] bg-[#101820] p-3" key={vote.userId}>
                        {vote.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={vote.user.avatarUrl} alt="Avatar" className="size-8 rounded-full" />
                        ) : (
                          <UserCircle className="size-8 text-[#8b94a1]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-white">{vote.user.displayName || vote.user.email || `User #${vote.userId}`}</p>
                            <span className={`text-[10px] font-black uppercase ${vote.decision === 'APPROVE' ? 'text-[#9df2c7]' : vote.decision === 'REJECT' ? 'text-[#ff9ab3]' : 'text-[#8b94a1]'}`}>
                              {vote.decision}
                            </span>
                          </div>
                          {vote.comment && (
                            <p className="mt-1 text-xs font-medium text-[#dce7f3]">{vote.comment}</p>
                          )}
                          <p className="mt-1 text-[10px] font-bold text-[#4b535f]">{new Date(vote.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-[#8b94a1]">No votes casted yet.</p>
                  )}
                </div>

                {isReviewable ? (
                  <div className="mt-4 border-t border-[#303842] pt-4">
                    <p className="mb-2 text-xs font-black text-white">{hasVoted ? 'Update Your Vote' : 'Your Vote'}</p>
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
                    <div className="mt-3 flex gap-2">
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
              </section>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4 flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1] mb-4">
                  Comments
                </p>
                
                {comments.length === 0 ? (
                  <p className="text-xs font-bold text-[#8b94a1] mb-4">No comments yet. Start the discussion!</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {comments.map((comment) => (
                      <div className="flex gap-3 rounded-[4px] bg-[#101820] p-3" key={comment.id}>
                        {comment.createdByUser?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={comment.createdByUser.avatarUrl} alt="Avatar" className="size-8 rounded-full shrink-0" />
                        ) : (
                          <UserCircle className="size-8 text-[#8b94a1] shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-[#FFD369]">
                              {comment.createdByUser?.displayName || comment.createdByUser?.email || 'Unknown User'}
                            </p>
                            <span className="text-[10px] font-bold text-[#4b535f]">
                              {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#dce7f3]">
                            {renderCommentText(comment.content.text)}
                          </p>
                          <button 
                            className="mt-2 text-[10px] font-bold text-[#8b94a1] hover:text-white transition-colors"
                            onClick={() => handleReply(comment.createdByUser?.displayName)}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
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
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                    >
                      <Check className="mr-1.5 size-3" />
                      Send
                    </Button>
                  </div>
                </div>
              </section>

              {canApprove && isReviewable ? (
                <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Review Actions
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
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
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
// PhucTD #editor-board end
