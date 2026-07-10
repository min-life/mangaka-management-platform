'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, CircleGauge, FileCheck2, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatActionTitle, formatActivityLogText } from '@/lib/activity-message';
import {
  getEditorBoardById,
  getEditorBoardMembers,
  getEditorBoardProjects,
  type BoardMemberResponse,
  type EditorBoardResponse,
} from '@/services/editor-board.service';
import {
  getEditorBoardActivityLogs,
  type ActivityLogResponse,
} from '@/services/activity-log.service';
import type { ProjectResponse } from '@/services/project.service';

import { getStatusLabel, getStatusStyle } from './applications/application-ui';

type ApplicationResponse = {
  createdAt: string;
  createdByUser?: { avatarUrl?: string; displayName?: string; email?: string };
  id: number;
  project?: { id: number; name: string };
  status: string;
  title: string;
};

type PageProps = {
  params: Promise<{ editorBoardId: string }>;
};

// PhucTD #editor-board start
export default function EditorBoardDashboardPage({ params }: PageProps) {
  const { editorBoardId } = use(params);

  const [board, setBoard] = useState<EditorBoardResponse | null>(null);
  const [members, setMembers] = useState<BoardMemberResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [activities, setActivities] = useState<ActivityLogResponse[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivityLogs = async () => {
      const activityResult = await getEditorBoardActivityLogs(editorBoardId, {
        limit: 3,
        page: 1,
      });

      setActivities(activityResult.activities);
      setActivityError(null);
      return activityResult.activities;
    };

    const fetchData = async () => {
      try {
        const boardData = await getEditorBoardById(Number(editorBoardId));
        setBoard(boardData);

        const membersData = await getEditorBoardMembers(editorBoardId, { limit: 5 });
        setMembers(membersData.members);

        const projectsData = await getEditorBoardProjects(editorBoardId);
        setProjects(projectsData.projects.slice(0, 5));

        const [appsRes, activityResult] = await Promise.all([
          api.get<{ data?: ApplicationResponse[] }, { data?: ApplicationResponse[] }>(
            `/editor-boards/${editorBoardId}/applications`,
          ),
          loadActivityLogs().catch(() => null),
        ]);

        setApplications(appsRes.data ?? []);
        if (!activityResult) {
          setActivities([]);
          setActivityError('Unable to load recent activity.');
        } else if (activityResult.length === 0) {
          window.setTimeout(() => {
            void loadActivityLogs().catch(() => undefined);
          }, 800);
        }
      } catch (error) {
        // Ignore error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [editorBoardId]);

  if (isLoading) {
    return <div className="p-8 text-center text-[#aeb7c2]">Loading dashboard...</div>;
  }

  if (!board) {
    return <div className="p-8 text-center text-red-400">Failed to load board details.</div>;
  }

  const activeMembersCount = members.length;
  const totalProjects = board._count?.projects || projects.length;
  const pendingApprovals = applications.filter((app) => app.status === 'PENDING').length;

  const currentMonth = new Date().getMonth();
  const approvedThisMonth = applications.filter(
    (app) => app.status === 'APPROVE' && new Date(app.createdAt).getMonth() === currentMonth,
  ).length;

  const statCards = [
    { label: 'Total Projects', meta: 'In this board', value: totalProjects },
    { label: 'Active Members', meta: 'Editors & Reviewers', value: activeMembersCount },
    { label: 'Pending Approvals', meta: 'Needs Review', value: pendingApprovals },
    { label: 'Approved This Month', meta: 'Publish Requests', value: approvedThisMonth },
  ];

  const formatActivityDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    }).format(date);
  };

  return (
    <section className="px-5 py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            alt={board.name}
            className="size-16 rounded-[5px] border border-[#39424f] bg-[#101820] object-cover"
            src={board.imageUrl || '/brand/3.png'}
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-black leading-8 text-white">{board.name}</h1>
              <Badge
                className="h-6 rounded-full border border-[#315846] bg-[#14291f] px-3 text-[10px] font-black text-[#9df2c7]"
                variant="outline"
              >
                Active
              </Badge>
            </div>
            <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
              Created by {board.createdByUser?.displayName || 'Unknown'}
            </p>
            {board.description ? (
              <p className="mt-1 text-xs text-[#aeb7c2]">{board.description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="h-9 rounded-[4px] border-[#4b535f] bg-[#222a34] px-4 text-xs font-black text-white hover:bg-[#303842]"
            variant="outline"
          >
            <Link href={`/studio/editor-boards/${editorBoardId}/members`}>
              <Users className="mr-2 size-4" />
              Manage Members
            </Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#101820] hover:bg-[#e6c94f]"
          >
            <Link href={`/studio/editor-boards/${editorBoardId}/projects`}>View Projects</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
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
              <span className="text-xs font-black text-[#FFD369]">{stat.meta}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Recent Publish Requests</h2>
            <Link
              className="text-xs font-black text-[#FFD369]"
              href={`/studio/editor-boards/${editorBoardId}/applications`}
            >
              View All
            </Link>
          </div>
          <div className="grid gap-3">
            {applications.slice(0, 5).map((app) => (
              <article
                className="flex items-center gap-3 rounded-[5px] border border-[#303842] bg-[#202832] p-3"
                key={app.id}
              >
                <span className="grid size-10 place-items-center rounded-[4px] bg-[#0f151d] text-[#dce7f3]">
                  <FileCheck2 className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-white">{app.title}</p>
                  <p className="mt-1 truncate text-[11px] font-bold text-[#aeb7c2]">
                    {app.project?.name} • By {app.createdByUser?.displayName || 'Unknown'} •{' '}
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={`h-6 rounded-[3px] px-2 text-[9px] font-black ${getStatusStyle(app.status)}`}
                >
                  {getStatusLabel(app.status)}
                </Badge>
                <Link
                  className="text-[#aeb7c2] hover:text-white"
                  href={`/studio/editor-boards/${editorBoardId}/applications`}
                >
                  <ChevronRight className="size-4" />
                </Link>
              </article>
            ))}
            {applications.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#aeb7c2]">
                No recent publish requests found.
              </p>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <aside className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">Board Projects</h2>
              <Link
                className="text-xs font-black text-[#FFD369]"
                href={`/studio/editor-boards/${editorBoardId}/projects`}
              >
                View All
              </Link>
            </div>
            <div className="grid gap-3">
              {projects.map((project) => (
                <div
                  className="flex items-center justify-between gap-3 border-b border-[#303842] pb-3 last:border-0 last:pb-0"
                  key={project.id}
                >
                  <div>
                    <p className="text-xs font-black text-white">{project.name}</p>
                    <p className="mt-1 text-[11px] font-bold text-[#aeb7c2]">
                      By {project.createdByUser?.displayName || 'Unknown'}
                    </p>
                  </div>
                  <Badge
                    className="h-6 rounded-[3px] border-[#39424f] bg-[#222a34] text-[10px] text-[#dce7f3]"
                    variant="outline"
                  >
                    Active
                  </Badge>
                </div>
              ))}
              {projects.length === 0 ? (
                <p className="text-center text-xs text-[#aeb7c2]">No projects attached.</p>
              ) : null}
            </div>
          </aside>

          <aside className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">Board Members</h2>
              <Link
                className="text-xs font-black text-[#FFD369]"
                href={`/studio/editor-boards/${editorBoardId}/members`}
              >
                View All
              </Link>
            </div>
            <div className="grid gap-3">
              {members.map((member) => (
                <div className="flex items-center gap-3" key={member.id}>
                  {member.avatarUrl ? (
                    <img
                      alt={member.displayName || ''}
                      className="size-8 rounded-full object-cover"
                      src={member.avatarUrl}
                    />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-[#303842] text-[10px] font-bold text-white">
                      {member.displayName?.charAt(0) || 'U'}
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-black text-white">{member.displayName}</p>
                    <p className="text-[10px] font-bold text-[#8b94a1]">
                      {member.isLead ? 'Lead Editor' : 'Member'}
                    </p>
                  </div>
                </div>
              ))}
              {members.length === 0 ? (
                <p className="text-center text-xs text-[#aeb7c2]">No members found.</p>
              ) : null}
            </div>
          </aside>

          <aside className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">Recent Activity</h2>
            </div>
            <div className="grid gap-3">
              {activities.map((activity) => (
                <article
                  className="rounded-[5px] border border-[#303842] bg-[#202832] p-3"
                  key={activity.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[4px] bg-[#101820] text-[#FFD369]">
                      <CircleGauge className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white">
                        {formatActionTitle(activity.action)}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[#aeb7c2]">
                        {formatActivityLogText(activity)}
                      </p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                        By {activity.actor?.displayName ??
                          activity.actor?.email ??
                          `User #${activity.actorId}`}{' '}
                        / {formatActivityDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {activityError ? (
                <p className="text-center text-xs text-red-300">{activityError}</p>
              ) : null}
              {!activityError && activities.length === 0 ? (
                <p className="text-center text-xs text-[#aeb7c2]">
                  No recent activity found.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
// PhucTD #editor-board end
