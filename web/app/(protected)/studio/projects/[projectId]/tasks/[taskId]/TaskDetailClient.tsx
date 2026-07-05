'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import {
  AlertTriangle,
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
import { getTaskById, getTaskFrames, updateTask } from '@/services/task.service';
import { createMaterial, getFileMaterialVersions } from '@/services/file.service';
import { LoadingState } from '@/components/ui/loading-state';

import {
  taskPriorityClassName,
  taskStatusClassName,
  taskStatusLabels,
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

export function TaskDetailClient({ projectId, taskId }: TaskDetailClientProps) {
  const [task, setTask] = useState<TaskWorkspaceItem | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('DISCUSSION');
  const [comments, setComments] = useState(initialComments);
  const [comment, setComment] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadTask = async (cancelled = false) => {
    if (!/^\d+$/.test(taskId)) {
      setError('Task was not found in the current project workspace.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await getTaskById(taskId);
      if (cancelled) return;

      // Fetch task frames
      let frameRegion: any = undefined;
      try {
        const frames = await getTaskFrames(taskId);
        if (frames && frames.length > 0) {
          frameRegion = {
            startX: Number(frames[0].startX),
            startY: Number(frames[0].startY),
            endX: Number(frames[0].endX),
            endY: Number(frames[0].endY),
          };
        }
      } catch (err) {
        console.error('Failed to load task frames:', err);
      }

      // Fetch preview url from material versions
      let previewUrl = '';
      try {
        const versionsRes = await getFileMaterialVersions(result.fileId);
        const rawArray = (versionsRes.versions || []) as any[];
        const latestVersion = rawArray.find((v: any) => v.isCurrent) || rawArray[0];
        if (latestVersion && latestVersion.materials?.length > 0) {
          const thumbnailMaterial =
            latestVersion.materials.find((m: any) => m.isThumbnail) || latestVersion.materials[0];
          previewUrl = thumbnailMaterial?.downloadUrl || thumbnailMaterial?.url || '';
        }
      } catch (err) {
        console.error('Failed to load file material versions for preview:', err);
      }

      // Parse submissions from description
      const parsedSubmissions: TaskSubmission[] = [];
      const lines = (result.description || '').split('\n');
      lines.forEach((line: string, lineIndex: number) => {
        const noteMatch = line.match(/\[Note:\s*([^\]]+)\]/);
        const versionMatch = line.match(/\[version:\s*([^\]]+)\]/);
        const reviewerMatch = line.match(/\[Reviewer:\s*([^\]]+)\]/);
        const resultMatch = line.match(/\[Result:\s*([^\]]+)\]/);

        if (noteMatch) {
          const ver = versionMatch ? versionMatch[1] : 'v1';
          const isLastLine = lineIndex === lines.length - 1;
          let submissionStatus: any = 'APPROVED';
          if (resultMatch) {
            submissionStatus = resultMatch[1].trim();
          } else if (result.status === 'REVIEW' && isLastLine) {
            submissionStatus = 'PENDING_REVIEW';
          }

          parsedSubmissions.push({
            id: `sub-parsed-${lineIndex}`,
            assetName: `submission-${ver}.png`,
            note: noteMatch[1].trim() + (reviewerMatch ? `\nReviewer: ${reviewerMatch[1].trim()}` : ''),
            status: submissionStatus,
            submittedAt: 'Date not parsed',
            submittedBy: result.assignedByUser?.displayName || 'Assignee',
          });
        }
      });

      const cleanDesc = result.description ? result.description.replace(/\s*\[version:v\d+\]/g, '') : '';

      setTask({
        assignee: result.assignedByUser?.displayName || result.assignedByUser?.email || 'Unassigned',
        description: cleanDesc,
        dueDate: result.deadline ? new Date(result.deadline).toLocaleDateString() : 'No due date',
        fileId: result.fileId,
        fileTitle: result.file?.title || `File #${result.fileId}`,
        id: String(result.id),
        isMine: /current|sarah/i.test(result.assignedByUser?.displayName || result.assignedByUser?.email || ''),
        previewUrl,
        priority: 'MEDIUM',
        region: frameRegion,
        status: result.status,
        submissions: parsedSubmissions,
        title: result.title,
        updatedAt: new Date(result.updatedAt).toLocaleDateString('en-US'),
        parent: result.parent ? {
          id: String(result.parent.id),
          title: result.parent.title,
          description: result.parent.description ?? null,
          status: result.parent.status,
        } : null,
      });
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

  useEffect(() => {
    let cancelled = false;
    void loadTask(cancelled);
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const pendingSubmission = useMemo(
    () => task?.submissions.find((submission) => submission.status === 'PENDING_REVIEW'),
    [task],
  );

  const handleSubmit = async (input: {
    image?: File;
    text?: File;
    source?: File;
    note: string;
  }) => {
    if (!task) return;
    try {
      const formData = new FormData();
      if (input.image) formData.append('image', input.image);
      if (input.text) formData.append('text', input.text);
      if (input.source) formData.append('source', input.source);
      formData.append('taskId', String(task.id));
      await createMaterial(task.fileId, formData);

      const versionsRes = await getFileMaterialVersions(task.fileId);
      const rawArray = (versionsRes.versions || []) as any[];
      const currentVersion = rawArray.find((version: any) => version.isCurrent) || rawArray[0];
      const targetVersionTag = `v${currentVersion?.version ?? rawArray.length}`;

      await updateTask(task.id, {
        status: 'REVIEW',
        description: `${task.description}\n[Note: ${input.note.trim()}] [version:${targetVersionTag}]`,
      });

      await loadTask();
      setActiveTab('SUBMISSIONS');
      toast.success('Work submitted.');
    } catch (err) {
      console.error('Failed to submit task work:', err);
      throw err;
    }
  };

  const handleReview = async (submissionId: string, approved: boolean) => {
    if (!task || !reviewNote.trim()) return;
    setIsSubmittingAction(true);
    try {
      const nextStatus = approved ? ('DONE' as const) : ('INPROGRESS' as const);

      const submissions = task.submissions || [];
      const sub = submissions.find((s) => s.id === submissionId);

      let updatedDescription = task.description;
      if (sub) {
        // Strip out the parsed reviewer notes
        const originalNote = sub.note.split('\nReviewer:')[0];
        const subNoteTag = `[Note: ${originalNote}]`;
        const reviewerTag = ` [Reviewer: ${reviewNote.trim()}] [Result: ${approved ? 'APPROVED' : 'CHANGES_REQUESTED'}]`;
        if (task.description.includes(subNoteTag)) {
          updatedDescription = task.description.replace(subNoteTag, `${subNoteTag}${reviewerTag}`);
        } else {
          updatedDescription = `${task.description}\n${reviewerTag}`;
        }
      }

      await updateTask(task.id, {
        status: nextStatus,
        description: updatedDescription,
      });

      setReviewNote('');
      await loadTask();
      toast.success(approved ? 'Version approved.' : 'Review rejected.');
    } catch (err) {
      console.error('Failed to review task:', err);
      toast.error('Failed to update task review. Please try again.');
    } finally {
      setIsSubmittingAction(false);
    }
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
    return <LoadingState message="Loading task workspace..." minHeight="70vh" variant="detail" />;
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
                {task.status !== 'DONE' && task.status !== 'REVIEW' ? (
                  task.parent && task.parent.status !== 'DONE' ? (
                    <div className="border border-[#6b2637] bg-[#371522] px-3 py-2 text-[10px] font-bold leading-4 text-[#ff9ab3] flex items-start gap-2 rounded-[4px] max-w-sm">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[#ff9ab3]" />
                      <div>
                        <p className="font-black">Submission Blocked</p>
                        <p className="text-[#dce7f3] mt-0.5 font-medium">
                          This task is a subtask of &ldquo;{task.parent.title}&rdquo; (Status: {task.parent.status}). The parent task must be completed (Done) first.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <SubmitWorkDialog onSubmit={handleSubmit} />
                  )
                ) : null}
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
                            <Button className="border-[#6b2637] bg-[#371522] text-[#ff9ab3] hover:bg-[#4a1d2c]" disabled={!reviewNote.trim() || isSubmittingAction} onClick={() => handleReview(submission.id, false)} variant="outline">
                              <X className="size-4" />
                              {isSubmittingAction ? 'Rejecting...' : 'Request Changes *'}
                            </Button>
                            <Button className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]" disabled={!reviewNote.trim() || isSubmittingAction} onClick={() => handleReview(submission.id, true)}>
                              <Check className="size-4" />
                              {isSubmittingAction ? 'Approving...' : 'Approve *'}
                            </Button>
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
