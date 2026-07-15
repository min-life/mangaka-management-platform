'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProjectParams } from '@/hooks/useProjectParams';
import { useEffect } from 'react';
import {
  CheckCircle2,
  Clock3,
  Upload,
  ImageIcon,
  ListChecks,
  AlertCircle,
  FileWarning,
  Clock,
  Activity,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';

import {
  getProjectById,
  getProjectDashboard,
  type ProjectResponse,
  type ProjectDashboardResponse,
} from '@/services/project.service';
import { useRealtimeProjectActivity } from '@/hooks/use-realtime-activity';
import { useProjectStore, selectProject, selectDashboard } from '../store/project-store';

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
  const { slug, numericId } = useProjectParams();

  const { activities } = useRealtimeProjectActivity(numericId);

  const { loadDashboard } = useProjectStore();
  const projectState = useProjectStore(selectProject(numericId));
  const dashboardState = useProjectStore(selectDashboard(numericId));

  const project = projectState.data;
  const dashboard = dashboardState.data;
  const isLoading = dashboardState.isLoading || !dashboardState.loaded;

  useEffect(() => {
    if (!numericId) return;
    void loadDashboard(numericId);
  }, [numericId, loadDashboard]);

  // Re-fetch when activity comes in (realtime)
  useEffect(() => {
    if (!numericId || activities.length === 0) return;
    void loadDashboard(numericId, true);
  }, [numericId, activities.length, loadDashboard]);

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-5">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-[4px] bg-[#1f2937]" />
          <div className="flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded-full bg-[#1f2937]" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-[#1f2937]" />
          </div>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-[4px] bg-[#1f2937]" />
      </div>

      {/* Action Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[90px] animate-pulse rounded-[5px] border border-[#26303b] bg-[#1a222d]" />
        ))}
      </div>

      {/* Overview Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[80px] animate-pulse rounded-[5px] border border-[#303842] bg-[#161d26]" />
        ))}
      </div>

      {/* Main Columns Skeleton */}
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="h-[300px] animate-pulse rounded-[5px] border border-[#39424f] bg-[#1a222d]" />
        <div className="h-[300px] animate-pulse rounded-[5px] border border-[#39424f] bg-[#1a222d]" />
      </div>
    </div>
  );
}

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!project || !dashboard) {
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

  // Tier 1: Action Bar
  const actionCards = [
    {
      label: 'Pending Applications',
      value: dashboard.actionNeeded.pendingApplications.length,
      meta: 'Action needed',
      icon: FileWarning,
      highlight: dashboard.actionNeeded.pendingApplications.length > 0,
      isDanger: false,
    },
    {
      label: 'Overdue Tasks',
      value: dashboard.actionNeeded.overdueTasks.length,
      meta: 'Needs attention',
      icon: AlertCircle,
      highlight: dashboard.actionNeeded.overdueTasks.length > 0,
      isDanger: true,
    },
    {
      label: 'Due Soon Tasks',
      value: dashboard.actionNeeded.dueSoonTasks.length,
      meta: 'Upcoming deadlines',
      icon: Clock,
      highlight: dashboard.actionNeeded.dueSoonTasks.length > 0,
      isDanger: false,
    },
  ];

  // Tier 2: Overview Stats
  const overviewCards = [
    { label: 'Active Members', value: dashboard.overview.totalMembers, meta: 'Contributors' },
    { label: 'Total Files', value: dashboard.overview.totalFiles, meta: 'Managed files' },
    {
      label: 'Open Tasks',
      value: dashboard.progressStats.pendingTasks + dashboard.progressStats.inProgressTasks + dashboard.progressStats.reviewTasks,
      meta: 'In production',
    },
  ];

  // Chart Data
  const chartData = [
    { name: 'Done', value: dashboard.progressStats.completedTasks, color: '#9df2c7' },
    { name: 'In Review', value: dashboard.progressStats.reviewTasks, color: '#ffd35b' },
    { name: 'In Progress', value: dashboard.progressStats.inProgressTasks, color: '#9ddde8' },
    { name: 'Pending', value: dashboard.progressStats.pendingTasks, color: '#dce7f3' },
  ].filter((d) => d.value > 0);

  const openTasks = dashboard.myWorkspace.activeTasks || [];
  const recentActivities = dashboard.recentFiles || [];

  return (
    <section className="px-5 py-6 space-y-6">
      {/* Header */}
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
              <span className="ml-2 text-xs font-bold text-[#8b94a1]">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
              Editor Board: {project.editorBoard?.name ?? 'No board assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Tier 1: Action Bar */}
      <div className="grid grid-cols-3 gap-4">
        {actionCards.map((stat) => {
          const isHighlight = stat.highlight;
          const bgClass = isHighlight
            ? stat.isDanger
              ? 'bg-[#3b1d1d] border-[#ff6b6b]/40'
              : 'bg-[#30270d] border-[#FFD369]/40'
            : 'bg-[#1a222d] border-[#39424f]';
          const textClass = isHighlight
            ? stat.isDanger
              ? 'text-[#ff6b6b]'
              : 'text-[#FFD369]'
            : 'text-[#aeb7c2]';
          const valueClass = isHighlight
            ? stat.isDanger
              ? 'text-[#ff6b6b]'
              : 'text-[#FFD369]'
            : 'text-white';
          const metaClass = isHighlight
            ? stat.isDanger
              ? 'text-[#ff6b6b]/80'
              : 'text-[#FFD369]/80'
            : 'text-[#5b626d]';

          return (
            <article
              className={`group rounded-[5px] border p-4 cursor-pointer transition-colors ${bgClass} hover:opacity-90`}
              key={stat.label}
              onClick={() => {
                if (stat.label === 'Pending Applications') {
                  router.push(`/studio/projects/${slug}/applications`);
                } else {
                  router.push(`/studio/projects/${slug}/tasks`);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = stat.icon;
                  return <Icon className={`size-4 ${textClass}`} />;
                })()}
                <p className={`text-[11px] font-black uppercase tracking-[0.04em] ${textClass}`}>
                  {stat.label}
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${valueClass}`}>{stat.value}</span>
                <span className={`text-xs font-bold ${metaClass}`}>{stat.meta}</span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Tier 2: Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        {overviewCards.map((stat) => (
          <article
            className="rounded-[5px] border border-[#303842] bg-[#161d26] p-4"
            key={stat.label}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.04em] text-[#8b94a1]">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-xs font-bold text-[#5b626d]">{stat.meta}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Tier 3: Main Columns */}
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
        {/* Left: Task Status Overview */}
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Task Status Overview</h2>
            <div className="flex items-center gap-2 text-[#aeb7c2]">
              <ListChecks className="size-4" />
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          {dashboard.overview.totalTasks === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[#303842]">
              <ListChecks className="size-7 text-[#5b626d]" />
              <p className="text-xs font-bold text-[#8b94a1]">No tasks in this project yet.</p>
            </div>
          ) : (
            <div className="flex h-[200px] items-center">
              <div className="flex-1 h-full relative min-h-0 min-w-0">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-white">{dashboard.overview.totalTasks}</span>
                  <span className="text-[10px] font-bold text-[#8b94a1] mt-1">TASKS</span>
                </div>
              </div>
              <div className="w-[130px] shrink-0 grid gap-4 pl-4 border-l border-[#303842]">
                {chartData.map((d) => {
                  const pct = Math.round((d.value / dashboard.overview.totalTasks) * 100);
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: d.color }}
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#aeb7c2]">{d.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{d.value}</span>
                          <span className="text-[10px] font-bold text-[#5b626d]">({pct}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right: Active Tasks Widget */}
        <aside className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5 flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">My Active Tasks</h2>
            <Clock3 className="size-4 text-[#dce7f3]" />
          </div>
          <div className="grid gap-3 flex-1">
            {openTasks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[5px] border border-dashed border-[#303842] p-4 text-center min-h-[160px]">
                <CheckCircle2 className="size-8 text-[#aeb7c2]/30 mb-3" />
                <p className="text-xs font-bold text-[#8b94a1]">All caught up!</p>
                <p className="text-[10px] text-[#5b626d] mt-1">No pending tasks assigned to you.</p>
              </div>
            ) : (
              openTasks.map((task: any) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                return (
                  <article
                    className="rounded-[5px] border border-[#303842] bg-[#202832] p-4 hover:border-[#FFD369]/30 transition-all cursor-pointer relative overflow-hidden"
                    key={task.id}
                    onClick={() => router.push(`/studio/projects/${slug}/tasks/${task.id}`)}
                  >
                    {isOverdue && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#ff6b6b]" />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className="text-xs font-black leading-5 text-white truncate max-w-[170px]"
                        title={task.title}
                      >
                        {task.title}
                      </p>
                      <span className="text-[9px] font-black text-[#101820] bg-[#FFD369] px-1.5 py-0.5 rounded-[3px] shrink-0 uppercase tracking-wider">
                        {task.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#8b94a1]">
                        File ID: {task.fileId || 'General'}
                      </span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue ? 'text-[#ff6b6b]' : 'text-[#aeb7c2]'}`}>
                        <Clock className="size-3" />
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Bottom: Recent Activity */}
      <div className="mt-5">
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Recent Activity</h2>
            <button
              onClick={() => router.push(`/studio/projects/${slug}/files`)}
              className="text-xs font-black text-[#FFD369] hover:underline"
              type="button"
            >
              View Files
            </button>
          </div>
          <div className="grid gap-4">
            {recentActivities.length === 0 ? (
              <p className="text-xs font-bold text-[#8b94a1] py-4 text-center">
                No recent activities found.
              </p>
            ) : (
              recentActivities.map((act: any, idx: number) => {
                // Determine icon color based on index to give varied visual scanning
                const styles = [
                  { color: '#dce7f3', bg: '#303842' },
                  { color: '#9ddde8', bg: '#2a454a' },
                  { color: '#ffd35b', bg: '#30270d' },
                  { color: '#9df2c7', bg: '#14291f' },
                ];
                const style = styles[idx % styles.length];

                return (
                  <div 
                    className="flex gap-4 p-3 rounded-[5px] hover:bg-[#202832] transition-colors cursor-pointer" 
                    key={act.id}
                    onClick={() => router.push(`/studio/projects/${slug}/files/${act.id}`)}
                  >
                    <span
                      className="grid size-9 place-items-center rounded-full shrink-0"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      <Activity className="size-4" />
                    </span>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-black text-white">
                        File: &ldquo;{act.title}&rdquo; updated
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-[#aeb7c2]">
                        <span>Chapter: {act.folder?.title || 'Unknown'}</span>
                        <span className="text-[#39424f]">&bull;</span>
                        <span className="text-[#8b94a1] flex items-center gap-1">
                          <Clock3 className="size-3" />
                          {formatUpdatedAt(act.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
