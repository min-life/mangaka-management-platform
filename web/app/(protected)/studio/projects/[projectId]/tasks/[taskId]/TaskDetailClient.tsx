'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Crosshair,
  ExternalLink,
  FileText,
  MessageSquare,
  Send,
  UserRound,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTaskById } from '@/services/task.service';

import {
  fallbackProjectTasks,
  readStoredTasks,
  readTaskOverrides,
  taskPriorityClassName,
  taskStatusClassName,
  taskStatusLabels,
  writeTaskOverride,
  type TaskSubmission,
  type TaskWorkspaceItem,
} from '../task-ui';
import { SubmitWorkDialog } from './SubmitWorkDialog';

type DetailTab = 'ACTIVITY' | 'DISCUSSION' | 'SUBMISSIONS';

type TaskDetailClientProps = {
  projectId: number;
  taskId: string;
};

type CommentItem = {
  author: string;
  content: string;
  id: string;
  time: string;
};

const initialComments: CommentItem[] = [
  {
    author: 'Lead Mangaka *',
    content: 'Keep the facial silhouette readable and add detail without changing the pose. *',
    id: 'comment-1',
    time: '2h ago *',
  },
  {
    author: 'Assistant *',
    content: 'Understood. I will preserve the line weight around the eyes and hair. *',
    id: 'comment-2',
    time: '1h ago *',
  },
];

function findFallbackTask(taskId: string) {
  const overrides = readTaskOverrides();

  return (
    overrides[taskId] ??
    readStoredTasks().find((task) => task.id === taskId) ??
    fallbackProjectTasks.find((task) => task.id === taskId) ??
    null
  );
}

export function TaskDetailClient({ projectId, taskId }: TaskDetailClientProps) {
  const [task, setTask] = useState<TaskWorkspaceItem | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('DISCUSSION');
  const [comments, setComments] = useState(initialComments);
  const [comment, setComment] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTask = async () => {
      const fallbackTask = findFallbackTask(taskId);
      if (fallbackTask) {
        setTask(fallbackTask);
        setIsLoading(false);
        return;
      }

      if (!/^\d+$/.test(taskId)) {
        setError('Task was not found in the current project workspace.');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getTaskById(taskId);
        if (!cancelled) {
          setTask({
            ...fallbackProjectTasks[0],
            assignee: result.assignedBy ? `User #${result.assignedBy} *` : 'Unassigned *',
            description: result.description ?? 'No description provided.',
            fileId: result.fileId,
            fileTitle: `File #${result.fileId} *`,
            id: String(result.id),
            isFallback: false,
            status: result.status,
            submissions: [],
            title: result.title,
            updatedAt: new Date(result.updatedAt).toLocaleDateString('en-US'),
          });
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load this task.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTask();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const pendingSubmission = useMemo(
    () => task?.submissions.find((submission) => submission.status === 'PENDING_REVIEW'),
    [task],
  );

  const persistTask = (nextTask: TaskWorkspaceItem) => {
    setTask(nextTask);
    writeTaskOverride(nextTask);
  };

  const handleSubmit = (input: { file: File; note: string }) => {
    if (!task) return;
    const submission: TaskSubmission = {
      assetName: input.file.name,
      id: `submission-${Date.now()}`,
      note: input.note || 'Submitted work file.',
      status: 'PENDING_REVIEW',
      submittedAt: 'Just now',
      submittedBy: 'Current user',
    };
    persistTask({ ...task, status: 'REVIEW', submissions: [submission, ...task.submissions], updatedAt: 'Just now *' });
    setActiveTab('SUBMISSIONS');
  };

  const handleReview = (submissionId: string, approved: boolean) => {
    if (!task || !reviewNote.trim()) return;
    persistTask({
      ...task,
      status: approved ? 'DONE' : 'INPROGRESS',
      submissions: task.submissions.map((submission) =>
        submission.id === submissionId
          ? { ...submission, note: `${submission.note}\nReviewer: ${reviewNote.trim()} *`, status: approved ? 'APPROVED' : 'CHANGES_REQUESTED' }
          : submission,
      ),
      updatedAt: 'Just now *',
    });
    setReviewNote('');
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    setComments((items) => [
      ...items,
      { author: 'Current user *', content: `${comment.trim()} *`, id: `comment-${Date.now()}`, time: 'Just now *' },
    ]);
    setComment('');
  };

  if (isLoading) {
    return <div className="grid min-h-[70vh] place-items-center text-sm font-bold text-[#aeb7c2]">Loading task workspace...</div>;
  }

  if (!task) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <p className="text-base font-black text-white">Task unavailable</p>
          <p className="mt-2 text-sm text-[#aeb7c2]">{error}</p>
          <Link className="mt-5 inline-flex h-9 items-center gap-2 border border-[#4b535f] px-4 text-xs font-black text-white" href={`/studio/projects/${projectId}/tasks`}>
            <ArrowLeft className="size-4" /> Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-full bg-[#091018]">
      <header className="flex min-h-12 flex-wrap items-center gap-2 border-b border-[#26303b] bg-[#151c25] px-5 py-2 text-xs font-bold text-[#8b94a1]">
        <Link className="flex items-center gap-2 text-[#dce7f3] hover:text-white" href={`/studio/projects/${projectId}/tasks`}>
          <ArrowLeft className="size-4" /> Tasks
        </Link>
        <span>/</span>
        <span>{task.fileTitle}</span>
        <span>/</span>
        <span className="min-w-0 truncate text-[#FFD369]">{task.title}</span>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <div className="p-5 lg:p-7">
            <div className="mx-auto max-w-6xl">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-white">{task.title}</h1>
                    <Badge className={`rounded-[3px] border ${taskStatusClassName[task.status]}`}>{taskStatusLabels[task.status]}</Badge>
                    <Badge className={`rounded-[3px] border ${taskPriorityClassName[task.priority]}`}>{task.priority} *</Badge>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#dce7f3]">{task.description}</p>
                </div>
                {task.status !== 'DONE' && task.status !== 'REVIEW' ? <SubmitWorkDialog onSubmit={handleSubmit} /> : null}
              </div>

              <div className="relative grid aspect-[16/10] max-h-[680px] w-full place-items-center overflow-hidden border border-[#303842] bg-[#111923] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${task.previewUrl})` }}>
                {task.region ? (
                  <div
                    className="absolute border-2 border-[#FFD369] bg-[#FFD369]/15 shadow-[0_0_0_9999px_rgba(4,9,14,0.46)]"
                    style={{
                      height: `${(task.region.endY - task.region.startY) * 100}%`,
                      left: `${task.region.startX * 100}%`,
                      top: `${task.region.startY * 100}%`,
                      width: `${(task.region.endX - task.region.startX) * 100}%`,
                    }}
                  >
                    <span className="absolute -left-3 -top-3 grid size-6 place-items-center rounded-full border-2 border-[#101820] bg-[#FFD369] text-[10px] font-black text-[#222831]">1</span>
                  </div>
                ) : (
                  <div className="border border-[#39424f] bg-[#101820]/90 px-4 py-3 text-center">
                    <Crosshair className="mx-auto size-5 text-[#8b94a1]" />
                    <p className="mt-2 text-xs font-black text-white">No region assigned *</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[10px] font-bold text-[#8b94a1]">Highlighted area is the production scope for this task. Preview and coordinates marked * are fallback data.</p>
            </div>
          </div>

          <section className="border-t border-[#26303b] bg-[#0d151e]">
            <div className="flex h-11 items-center gap-1 overflow-x-auto border-b border-[#26303b] px-5 lg:px-7">
              {(['DISCUSSION', 'SUBMISSIONS', 'ACTIVITY'] as const).map((tab) => (
                <button className={`relative h-full px-4 text-xs font-black ${activeTab === tab ? 'text-[#FFD369]' : 'text-[#aeb7c2] hover:text-white'}`} key={tab} onClick={() => setActiveTab(tab)} type="button">
                  {tab === 'SUBMISSIONS' ? `Submissions (${task.submissions.length})` : tab[0] + tab.slice(1).toLowerCase()}
                  {activeTab === tab ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FFD369]" /> : null}
                </button>
              ))}
            </div>
            <div className="mx-auto max-w-6xl p-5 lg:p-7">
              {activeTab === 'DISCUSSION' ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    {comments.map((item) => (
                      <article className="border border-[#303842] bg-[#151c25] p-4" key={item.id}>
                        <div className="flex justify-between gap-3"><p className="text-xs font-black text-white">{item.author}</p><span className="text-[10px] font-bold text-[#8b94a1]">{item.time}</span></div>
                        <p className="mt-2 text-xs font-medium leading-5 text-[#dce7f3]">{item.content}</p>
                      </article>
                    ))}
                  </div>
                  <div className="border border-[#39424f] bg-[#151c25] p-3">
                    <div className="flex items-center gap-2 text-xs font-black text-white"><MessageSquare className="size-4 text-[#FFD369]" /> Add comment *</div>
                    <textarea className="mt-3 h-24 w-full resize-none bg-[#101820] p-3 text-xs text-white outline-none placeholder:text-[#8b94a1]" onChange={(event) => setComment(event.target.value)} placeholder="Discuss this task or selected region..." value={comment} />
                    <Button className="mt-3 h-8 bg-[#FFD369] text-[10px] font-black text-[#222831] hover:bg-[#eac04f]" disabled={!comment.trim()} onClick={handleComment}><Send className="size-3.5" /> Comment *</Button>
                  </div>
                </div>
              ) : activeTab === 'SUBMISSIONS' ? (
                <div className="space-y-3">
                  {task.submissions.length ? task.submissions.map((submission) => (
                    <article className="border border-[#303842] bg-[#151c25] p-4" key={submission.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="text-sm font-black text-white">{submission.assetName}</p><p className="mt-1 text-[10px] font-bold text-[#8b94a1]">Submitted by {submission.submittedBy} · {submission.submittedAt}</p></div>
                        <Badge className="rounded-[3px] border border-[#6c5516] bg-[#30270d] text-[#ffd35b]">{submission.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#dce7f3]">{submission.note}</p>
                      {submission.status === 'PENDING_REVIEW' ? (
                        <div className="mt-4 border-t border-[#303842] pt-4">
                          <textarea className="h-20 w-full resize-none bg-[#101820] p-3 text-xs text-white outline-none placeholder:text-[#8b94a1]" onChange={(event) => setReviewNote(event.target.value)} placeholder="Required review note..." value={reviewNote} />
                          <div className="mt-3 flex justify-end gap-2">
                            <Button className="border-[#6b2637] bg-[#371522] text-[#ff9ab3] hover:bg-[#4a1d2c]" disabled={!reviewNote.trim()} onClick={() => handleReview(submission.id, false)} variant="outline"><X className="size-4" /> Request Changes *</Button>
                            <Button className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]" disabled={!reviewNote.trim()} onClick={() => handleReview(submission.id, true)}><Check className="size-4" /> Approve *</Button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )) : <p className="border border-[#303842] bg-[#151c25] px-4 py-8 text-center text-xs font-bold text-[#8b94a1]">No work has been submitted yet.</p>}
                </div>
              ) : (
                <div className="space-y-4 border-l border-[#39424f] pl-5">
                  {[
                    `${task.assignee} was assigned to this task. *`,
                    task.region ? 'Production region was attached to the source file. *' : 'Task was created without a canvas region. *',
                    pendingSubmission ? `${pendingSubmission.submittedBy} submitted work for review. *` : `Task status changed to ${taskStatusLabels[task.status]}. *`,
                  ].map((event, index) => <div className="relative" key={event}><span className="absolute -left-[25px] top-1 size-2 rounded-full bg-[#FFD369]" /><p className="text-xs font-bold text-[#dce7f3]">{event}</p><p className="mt-1 text-[10px] text-[#8b94a1]">{index + 1}h ago *</p></div>)}
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="border-l border-[#26303b] bg-[#0d151e] xl:min-h-[calc(100vh-7rem)]">
          <section className="border-b border-[#26303b] p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.08em] text-white">Task Information</h2>
            <dl className="mt-5 space-y-5">
              {[
                { icon: UserRound, label: 'Assignee', value: task.assignee },
                { icon: CalendarDays, label: 'Due Date', value: task.dueDate },
                { icon: Clock3, label: 'Updated', value: task.updatedAt },
                { icon: FileText, label: 'Related File', value: task.fileTitle },
              ].map(({ icon: Icon, label, value }) => <div key={label}><dt className="flex items-center gap-2 text-[9px] font-black uppercase text-[#8b94a1]"><Icon className="size-3" />{label}</dt><dd className="mt-1 text-xs font-black text-white">{value}</dd></div>)}
            </dl>
          </section>
          <section className="border-b border-[#26303b] p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.08em] text-white">Production Scope</h2>
            <p className="mt-3 text-xs font-medium leading-5 text-[#aeb7c2]">Work only inside the highlighted region unless the discussion explicitly expands the scope. *</p>
            <Link className="mt-4 inline-flex h-9 items-center gap-2 border border-[#4b535f] px-3 text-xs font-black text-white hover:bg-[#303842]" href={`/studio/projects/${projectId}/files/${task.fileId}`}>
              <ExternalLink className="size-4" /> Open Source File
            </Link>
          </section>
          <section className="p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.08em] text-white">Workflow</h2>
            <ol className="mt-4 space-y-3 text-xs font-bold text-[#aeb7c2]">
              <li className="text-white">1. Work on assigned region</li>
              <li className={task.submissions.length ? 'text-white' : ''}>2. Submit completed result</li>
              <li className={task.status === 'REVIEW' || task.status === 'DONE' ? 'text-white' : ''}>3. Mangaka review</li>
              <li className={task.status === 'DONE' ? 'text-[#9df2c7]' : ''}>4. Approve into next file version *</li>
            </ol>
          </section>
        </aside>
      </div>
    </section>
  );
}
