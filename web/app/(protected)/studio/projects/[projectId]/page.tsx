'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Upload,
  Users,
  ImageIcon,
  ListChecks,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';

import {
  getProjectById,
  getProjectMembers,
  getProjectFolders,
  getFolderFiles,
  type ProjectResponse,
} from '@/services/project.service';
import { getFileTasks } from '@/services/file.service';
import { getProjectApplications } from '@/services/application.service';
import { useRealtimeProjectActivity } from '@/hooks/use-realtime-activity';

function formatUpdatedAt(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return `${diffHours || 1}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export default function ProjectDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId ? String(params.projectId) : '';

  const { activities } = useRealtimeProjectActivity(projectId);

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filesCount, setFilesCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [publishingRequestsCount, setPublishingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    async function loadDashboardData() {
      try {
        const proj = await getProjectById(Number(projectId));
        if (!isMounted) return;
        setProject(proj);

        const membersRes = await getProjectMembers(Number(projectId));
        if (!isMounted) return;
        const membersList = membersRes.members || [];
        setMembersCount(membersList.length);

        const appsRes = await getProjectApplications(projectId);
        if (!isMounted) return;
        const appsList = appsRes.applications || [];
        setApplicationsCount(appsList.length);
        const publishingReqs = appsList.filter((app: any) => app.type === 'PUBLISH_REQUEST');
        setPublishingRequestsCount(publishingReqs.length);

        const foldersRes = await getProjectFolders(Number(projectId));
        if (!isMounted) return;
        const foldersList = foldersRes.folders || [];
        let tempFilesCount = 0;
        const loadedTasks: any[] = [];

        for (const folder of foldersList) {
          const filesRes = await getFolderFiles(folder.id);
          const filesList = filesRes.files || [];
          tempFilesCount += filesList.length;
          for (const file of filesList) {
            const fileTasks = await getFileTasks(file.id);
            loadedTasks.push(
              ...fileTasks.map((t: any) => ({
                ...t,
                fileName: file.title,
                folderName: folder.title,
              })),
            );
          }
        }

        if (!isMounted) return;
        setFilesCount(tempFilesCount);
        setTasks(loadedTasks);
      } catch (err) {
        console.error('Failed to load project dashboard details:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [projectId, activities.length]);

  if (isLoading) {
    return <LoadingState message="Loading project workspace..." minHeight="70vh" />;
  }

  if (!project) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <p className="text-sm font-bold text-[#8b94a1]">Project not found or access denied.</p>
        <Button
          onClick={() => router.push('/studio')}
          className="h-9 bg-[#FFD369] text-xs font-black text-[#101820] hover:bg-[#eac04f]"
        >
          Return to Workspace
        </Button>
      </div>
    );
  }

  const statCards = [
    { label: 'Active Applications', value: String(applicationsCount), meta: 'Review pipeline' },
    {
      label: 'Open Tasks',
      value: String(tasks.filter((t) => t.status !== 'DONE').length),
      meta: 'In production',
    },
    { label: 'Active Members', value: String(membersCount), meta: 'Contributors' },
    {
      label: 'Publishing Requests',
      value: String(publishingRequestsCount),
      meta: 'Ready for review',
    },
  ];

  // Map tasks to "deadlines" card lists or show empty state
  const openTasks = tasks.filter((t) => t.status !== 'DONE').slice(0, 3);

  // Map recent activities using tasks list or mock entries if empty
  const recentActivities = tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <section className="px-5 py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {project.imageUrl && project.imageUrl.trim() !== '' ? (
            <img
              alt=""
              className="size-16 rounded-[5px] border border-[#39424f] object-cover"
              src={project.imageUrl}
            />
          ) : (
            <div className="grid size-16 place-items-center rounded-[5px] border border-[#39424f] bg-[#1a222d] text-[#8b94a1]">
              <ImageIcon className="size-7 text-[#8b94a1]/55" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-black leading-8 text-white">{project.name}</h1>
              <Badge
                className="h-6 rounded-full border border-[#315846] bg-[#14291f] px-3 text-[10px] font-black text-[#9df2c7]"
                variant="outline"
              >
                Active
              </Badge>
            </div>
            <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
              Editor Board: {project.editorBoard?.name ?? 'No board assigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <article
            className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4"
            key={stat.label}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.04em] text-[#aeb7c2]">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-xs font-bold text-[#FFD369]">{stat.meta}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_320px] gap-5">
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Task Status Overview</h2>
            <div className="flex items-center gap-2 text-[#aeb7c2]">
              <ListChecks className="size-4" />
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          {tasks.length === 0 ? (
            <div className="flex h-[190px] flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[#303842]">
              <ListChecks className="size-7 text-[#5b626d]" />
              <p className="text-xs font-bold text-[#8b94a1]">No tasks in this project yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {[
                {
                  label: 'Done',
                  count: tasks.filter((t) => t.status === 'DONE').length,
                  color: '#9df2c7',
                  bg: '#14291f',
                  border: '#315846',
                },
                {
                  label: 'In Review',
                  count: tasks.filter((t) => t.status === 'REVIEW').length,
                  color: '#ffd35b',
                  bg: '#30270d',
                  border: '#6c5516',
                },
                {
                  label: 'In Progress',
                  count: tasks.filter((t) => t.status === 'INPROGRESS').length,
                  color: '#9ddde8',
                  bg: '#2a454a',
                  border: '#4f6e73',
                },
                {
                  label: 'Pending',
                  count: tasks.filter((t) => t.status === 'PENDING').length,
                  color: '#dce7f3',
                  bg: '#20282b',
                  border: '#4a4f55',
                },
              ].map(({ label, count, color, bg, border }) => {
                const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div className="flex items-center gap-3" key={label}>
                    <span className="w-24 shrink-0 text-[11px] font-bold text-[#aeb7c2]">
                      {label}
                    </span>
                    <div
                      className="flex-1 overflow-hidden rounded-full bg-[#303842]"
                      style={{ height: 8 }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span
                      className="w-16 shrink-0 rounded-[4px] border px-2 py-0.5 text-center text-[10px] font-black"
                      style={{ color, backgroundColor: bg, borderColor: border }}
                    >
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-5 border-t border-[#303842] pt-4 text-[11px] font-bold text-[#8b94a1]">
            {tasks.length} total tasks &bull; {filesCount} files managed
          </div>
        </section>

        <aside className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Active Tasks</h2>
            <Clock3 className="size-4 text-[#dce7f3]" />
          </div>
          <div className="grid gap-3">
            {openTasks.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-[5px] border border-dashed border-[#303842] p-4 text-center">
                <CheckCircle2 className="size-6 text-[#aeb7c2]/40" />
                <p className="mt-2 text-xs font-bold text-[#aeb7c2]">All caught up!</p>
              </div>
            ) : (
              openTasks.map((task) => (
                <article
                  className="rounded-[5px] border border-[#303842] bg-[#202832] p-4 hover:border-[#FFD369]/30 transition-all cursor-pointer"
                  key={task.id}
                  onClick={() => router.push(`/studio/projects/${projectId}/tasks`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className="text-xs font-black leading-5 text-white truncate max-w-[170px]"
                      title={task.title}
                    >
                      {task.title}
                    </p>
                    <span className="text-[10px] font-black text-[#FFD369] shrink-0 uppercase tracking-wider">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-[#aeb7c2]">
                    File: {task.fileName || 'General'}
                  </p>
                  <Progress
                    className="mt-3 h-1.5 rounded-none bg-[#39424f] [&_[data-slot=progress-indicator]]:bg-[#FFD369]"
                    value={
                      task.status === 'DONE'
                        ? 100
                        : task.status === 'REVIEW'
                          ? 75
                          : task.status === 'INPROGRESS'
                            ? 40
                            : 10
                    }
                  />
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Recent Activity</h2>
            <button
              onClick={() => router.push(`/studio/projects/${projectId}/files`)}
              className="text-xs font-black text-[#FFD369]"
              type="button"
            >
              View Files
            </button>
          </div>
          <div className="grid gap-5">
            {recentActivities.length === 0 ? (
              <p className="text-xs font-bold text-[#8b94a1] py-4 text-center">
                No recent activities found.
              </p>
            ) : (
              recentActivities.map((act, index) => (
                <div className="flex gap-4" key={act.id}>
                  <span className="grid size-8 place-items-center rounded-full bg-[#303842] text-[#dce7f3] shrink-0">
                    <Upload className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-white">
                      Task: &ldquo;{act.title}&rdquo; updated
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-5 text-[#aeb7c2]">
                      Chapter folder: {act.folderName} &bull; File: {act.fileName}
                    </p>
                    <p className="mt-1 text-[10px] font-black text-[#8b94a1]">
                      {formatUpdatedAt(act.updatedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <h2 className="mb-5 text-sm font-black text-white">Project Specs</h2>
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-[5px] border border-[#303842] bg-[#202832] p-3 text-xs font-bold">
              <span className="text-[#aeb7c2]">Project ID</span>
              <span className="text-white font-mono">{project.id}</span>
            </div>
            <div className="flex items-center justify-between rounded-[5px] border border-[#303842] bg-[#202832] p-3 text-xs font-bold">
              <span className="text-[#aeb7c2]">Total Chapters</span>
              <span className="text-white">{filesCount} pages managed</span>
            </div>
            <div className="flex items-center justify-between rounded-[5px] border border-[#303842] bg-[#202832] p-3 text-xs font-bold">
              <span className="text-[#aeb7c2]">Created Date</span>
              <span className="text-white">{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
