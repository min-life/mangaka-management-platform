'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { SubmissionFrameComment } from '../file-ui';

type CommentItem = {
  author: string;
  content: string;
  id: string;
  time: string;
};

const initialComments: CommentItem[] = [
  {
    author: 'Lead Editor *',
    content: 'Please check the panel flow and dialogue density before the review request. *',
    id: 'comment-1',
    time: '45m ago *',
  },
];

type FileCommentsPanelProps = {
  contextKey: string;
  contextLabel: string;
  fileId?: number | string;
  frameComments?: SubmissionFrameComment[];
  onSelectFrame?: (comment: SubmissionFrameComment) => void;
  taskId?: number | string | null;
};

export function FileCommentsPanel({
  contextKey,
  contextLabel,
  fileId,
  frameComments = [],
  onSelectFrame,
  taskId,
}: FileCommentsPanelProps) {
  const [commentsByContext, setCommentsByContext] = useState<Record<string, CommentItem[]>>({
    file: initialComments,
  });
  const [content, setContent] = useState('');
  const comments = commentsByContext[contextKey] ?? [];

  const handleComment = () => {
    setCommentsByContext((currentContexts) => ({
      ...currentContexts,
      [contextKey]: [
        ...(currentContexts[contextKey] ?? []),
        {
          author: 'Current user *',
          content: `${content.trim()} *`,
          id: `comment-local-${Date.now()}`,
          time: 'Just now *',
        },
      ],
    }));
    setContent('');
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
          <MessageSquare className="size-4 text-[#FFD369]" />
          Discussion *
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
            {fileId && taskId ? ' · ' : null}
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
              <p className="text-xs font-black text-[#ffd35b]">Frame {index + 1} · {item.author}</p>
              <p className="text-[10px] font-bold text-[#d9bd70]">{item.time}</p>
            </div>
            <p className="mt-2 text-xs font-medium leading-5 text-[#fff0bc]">{item.content}</p>
          </button>
        ))}
        {comments.map((comment) => (
          <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-3" key={comment.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-white">{comment.author}</p>
              <p className="text-[10px] font-bold text-[#8b94a1]">{comment.time}</p>
            </div>
            <p className="mt-2 text-xs font-medium leading-5 text-[#dce7f3]">{comment.content}</p>
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
            disabled={!content.trim()}
            onClick={handleComment}
          >
            <Send className="size-3.5" />
            Comment *
          </Button>
        </div>
      </div>
    </section>
  );
}
