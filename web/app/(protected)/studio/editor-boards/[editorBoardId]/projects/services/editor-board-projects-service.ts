import { getEditorBoardProjects as getEditorBoardProjectsRequest } from '@/services/editor-board.service';
import {
  getProjectApplications,
  getProjectMembers,
  getProjectStats,
  type ProjectApplicationResponse,
  type ProjectMemberResponse,
  type ProjectResponse,
  type ProjectStatResponse,
} from '@/services/project.service';

export type ProjectStatus = 'HIATUS' | 'IN_PRODUCTION' | 'STORYBOARDING';
export type PublishingStatus = 'LIVE' | 'PENDING_APPROVAL' | 'SCHEDULED';

export type ProjectMember = {
  avatarUrl: string;
  displayName: string;
  id: number;
  roleName: string;
};

export type EditorBoardProject = {
  applicationsCount: number;
  contactName: string;
  createdAt: string;
  description: string | null;
  editorBoardId: number;
  id: number;
  imageUrl: string | null;
  imprintName: string;
  members: ProjectMember[];
  name: string;
  nextDeadline: string;
  projectStats: Array<{
    id: number;
    metrics: {
      cycleTimeDays: number;
      progress: number;
      status: ProjectStatus;
      targetChapter: string;
    };
    projectId: number;
    updatedAt: string;
  }>;
  publishingStatus: PublishingStatus;
  updatedAt: string;
};

export type EditorBoardProjectsSummary = {
  activeStaffers: number;
  averageCycleTimeDays: number;
  averageCycleTimeTrendPercent: number;
  criticalDeadlines: number;
  editorialTeamCount: number;
  projectCount: number;
};

function mapProjectResponse(project: ProjectResponse, editorBoardId: number | string): EditorBoardProject {
  const createdByName =
    project.createdByUser?.displayName ?? project.createdByUser?.email ?? 'Unassigned';
  const updatedByName =
    project.updatedByUser?.displayName ?? project.updatedByUser?.email ?? createdByName;

  return {
    applicationsCount: 0,
    contactName: updatedByName,
    createdAt: project.createdAt,
    description: project.description ?? 'No production summary has been added yet.',
    editorBoardId: project.editorBoardId ?? project.editorBoard?.id ?? Number(editorBoardId),
    id: project.id,
    imageUrl: project.imageUrl ?? null,
    imprintName: project.editorBoard?.name ?? 'Editor Board Project',
    members:
      project.userProjects?.map((member) => ({
        avatarUrl: member.user.avatarUrl ?? '',
        displayName: member.user.displayName ?? member.user.email ?? 'Member',
        id: member.user.id,
        roleName: member.role.name,
      })) ?? [
        {
          avatarUrl: project.createdByUser?.avatarUrl ?? '',
          displayName: createdByName,
          id: project.createdByUser?.id ?? project.id,
          roleName: 'Project Owner',
        },
      ],
    name: project.name,
    nextDeadline: project.updatedAt,
    projectStats: [
      {
        id: project.id,
        metrics: {
          cycleTimeDays: 0,
          progress: 0,
          status: 'IN_PRODUCTION',
          targetChapter: 'Chapter --',
        },
        projectId: project.id,
        updatedAt: project.updatedAt,
      },
    ],
    publishingStatus: 'PENDING_APPROVAL',
    updatedAt: project.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNumberMetric(metrics: unknown, key: string, fallback: number) {
  if (!isRecord(metrics)) {
    return fallback;
  }

  const value = metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getStringMetric(metrics: unknown, key: string, fallback: string) {
  if (!isRecord(metrics)) {
    return fallback;
  }

  const value = metrics[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function getProjectStatus(metrics: unknown): ProjectStatus {
  const status = getStringMetric(metrics, 'status', 'IN_PRODUCTION');

  if (status === 'HIATUS' || status === 'IN_PRODUCTION' || status === 'STORYBOARDING') {
    return status;
  }

  return 'IN_PRODUCTION';
}

function mapMembers(members: ProjectMemberResponse[], fallbackProject: ProjectResponse): ProjectMember[] {
  if (members.length > 0) {
    return members.map((member) => ({
      avatarUrl: member.avatarUrl ?? '',
      displayName: member.displayName ?? member.email ?? 'Member',
      id: member.id,
      roleName: member.role.name,
    }));
  }

  const createdByName =
    fallbackProject.createdByUser?.displayName ??
    fallbackProject.createdByUser?.email ??
    'Unassigned';

  return [
    {
      avatarUrl: fallbackProject.createdByUser?.avatarUrl ?? '',
      displayName: createdByName,
      id: fallbackProject.createdByUser?.id ?? fallbackProject.id,
      roleName: 'Project Owner',
    },
  ];
}

function mapStats(project: ProjectResponse, stat: ProjectStatResponse | null) {
  const metrics = stat?.metrics;

  return [
    {
      id: stat?.id ?? project.id,
      metrics: {
        cycleTimeDays: getNumberMetric(metrics, 'cycleTimeDays', 0),
        progress: getNumberMetric(metrics, 'progress', 0),
        status: getProjectStatus(metrics),
        targetChapter: getStringMetric(metrics, 'targetChapter', 'Chapter --'),
      },
      projectId: stat?.projectId ?? project.id,
      updatedAt: stat?.updatedAt ?? project.updatedAt,
    },
  ];
}

function getPublishingStatus(applications: ProjectApplicationResponse[]): PublishingStatus {
  if (applications.some((application) => application.status === 'APPROVE')) {
    return 'LIVE';
  }

  if (applications.some((application) => application.status === 'PENDING')) {
    return 'PENDING_APPROVAL';
  }

  return 'SCHEDULED';
}

async function getProjectDetails(project: ProjectResponse, editorBoardId: number | string) {
  const [membersResult, statResult, applicationsResult] = await Promise.allSettled([
    getProjectMembers(project.id, {
      field: 'displayName',
      limit: 100,
      order: 'asc',
      page: 1,
    }),
    getProjectStats(project.id),
    getProjectApplications(project.id, {
      field: 'updatedAt',
      limit: 100,
      order: 'desc',
      page: 1,
    }),
  ]);

  const baseProject = mapProjectResponse(project, editorBoardId);
  const members = membersResult.status === 'fulfilled' ? membersResult.value.members : [];
  const stat = statResult.status === 'fulfilled' ? statResult.value : null;
  const applications =
    applicationsResult.status === 'fulfilled' ? applicationsResult.value.applications : [];

  return {
    ...baseProject,
    applicationsCount: applications.length,
    members: mapMembers(members, project),
    nextDeadline: applications[0]?.updatedAt ?? stat?.updatedAt ?? project.updatedAt,
    projectStats: mapStats(project, stat),
    publishingStatus: getPublishingStatus(applications),
  } satisfies EditorBoardProject;
}

export async function getEditorBoardProjects(editorBoardId: number | string) {
  const result = await getEditorBoardProjectsRequest(editorBoardId, {
    field: 'createdAt',
    limit: 50,
    order: 'desc',
    page: 1,
  });

  return await Promise.all(
    result.projects.map((project) => getProjectDetails(project, editorBoardId)),
  );
}

export async function getEditorBoardProjectsSummary(editorBoardId: number | string) {
  const boardProjects = await getEditorBoardProjects(editorBoardId);
  const cycleTimes = boardProjects.map((project) => project.projectStats[0]?.metrics.cycleTimeDays ?? 0);
  const activeStafferIds = new Set(
    boardProjects.flatMap((project) => project.members.map((member) => member.id)),
  );
  const roleNames = new Set(
    boardProjects.flatMap((project) => project.members.map((member) => member.roleName)),
  );

  return {
    activeStaffers: activeStafferIds.size,
    averageCycleTimeDays:
      cycleTimes.length > 0
        ? Number((cycleTimes.reduce((total, value) => total + value, 0) / cycleTimes.length).toFixed(1))
        : 0,
    averageCycleTimeTrendPercent: 12,
    criticalDeadlines: boardProjects.filter((project) => project.applicationsCount >= 3).length,
    editorialTeamCount: roleNames.size,
    projectCount: boardProjects.length,
  } satisfies EditorBoardProjectsSummary;
}
