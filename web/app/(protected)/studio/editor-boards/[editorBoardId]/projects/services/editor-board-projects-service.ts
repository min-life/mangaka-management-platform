import { projects } from '../const/projects';
import { getEditorBoardProjects as getEditorBoardProjectsRequest } from '@/services/editor-board.service';
import type { ProjectResponse } from '@/services/project.service';

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

const MOCK_DELAY = 180;

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function wait() {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
}

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

export async function getEditorBoardProjects(editorBoardId: number | string) {
  try {
    const result = await getEditorBoardProjectsRequest(editorBoardId);
    return result.projects.map((project) => mapProjectResponse(project, editorBoardId));
  } catch {
    await wait();

    return clone(projects).filter(
      (project) => String(project.editorBoardId) === String(editorBoardId),
    );
  }
}

export async function getEditorBoardProjectsSummary(editorBoardId: number | string) {
  const boardProjects = await getEditorBoardProjects(editorBoardId);
  const cycleTimes = boardProjects.map((project) => project.projectStats[0]?.metrics.cycleTimeDays ?? 0);

  return {
    activeStaffers: boardProjects.reduce((total, project) => total + project.members.length, 0),
    averageCycleTimeDays:
      cycleTimes.length > 0
        ? Number((cycleTimes.reduce((total, value) => total + value, 0) / cycleTimes.length).toFixed(1))
        : 0,
    averageCycleTimeTrendPercent: 12,
    criticalDeadlines: boardProjects.filter((project) => project.applicationsCount >= 3).length,
    editorialTeamCount: 4,
    projectCount: boardProjects.length,
  } satisfies EditorBoardProjectsSummary;
}
