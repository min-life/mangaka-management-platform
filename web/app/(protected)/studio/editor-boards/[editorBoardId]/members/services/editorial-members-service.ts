import {
  addEditorBoardMembers,
  getEditorBoardMembers as getEditorBoardMembersRequest,
  getEditorBoardProjects as getEditorBoardProjectsRequest,
  removeEditorBoardMember,
  setEditorBoardMemberLead,
  type BoardMemberResponse,
} from '@/services/editor-board.service';
import { getActivityLogs, type ActivityLogResponse } from '@/services/activity-log.service';
import { getProjectMembers } from '@/services/project.service';
import { getUsers, type UserResponse } from '@/services/user.service';

export type MemberStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type EditorialMember = {
  activeProjects: number;
  avatarUrl: string | null;
  displayName: string | null;
  email: string;
  id: number;
  isLead: boolean;
  joinedAt?: string;
  lastActiveAt?: string;
  region: string;
  reviewLoad: number;
  roleTitle: string;
  status: MemberStatus;
  userEditorBoard: {
    editorBoardId: number;
    isLead: boolean;
    userId: number;
  };
};

export type MemberActivity = {
  description: string;
  id: number;
  memberName: string;
  timestamp: string;
  title: string;
  type: 'COMMENT' | 'REVIEW' | 'STATUS';
};

export type EditorialMembersSummary = {
  activeMembers: number;
  availableMembers: number;
  leadMembers: number;
  reviewLoad: number;
  totalMembers: number;
};

type MemberWorkload = {
  activeProjects: number;
  reviewLoad: number;
};

function getStatusFromWorkload(workload: MemberWorkload | undefined): MemberStatus {
  if (!workload) {
    return 'OFFLINE';
  }

  if (workload.reviewLoad === 0) {
    return 'OFFLINE';
  }

  return workload.reviewLoad > 8 ? 'BUSY' : 'AVAILABLE';
}

function mapBoardMember(
  member: BoardMemberResponse,
  editorBoardId: number | string,
  workload?: MemberWorkload,
): EditorialMember {
  const memberName = member.displayName ?? member.email ?? 'Board Member';
  const numericBoardId = Number(editorBoardId);

  return {
    activeProjects: workload?.activeProjects ?? 0,
    avatarUrl: member.avatarUrl ?? null,
    displayName: member.displayName ?? memberName,
    email: member.email ?? `${member.id}@inkly.local`,
    id: member.id,
    isLead: member.isLead,
    joinedAt: member.createdAt,
    lastActiveAt: member.updatedAt,
    region: member.isLead ? 'Editorial Lead Desk' : 'Editorial Desk',
    reviewLoad: workload?.reviewLoad ?? 0,
    roleTitle: member.isLead ? 'Lead Editor' : 'Editorial Member',
    status: getStatusFromWorkload(workload),
    userEditorBoard: {
      editorBoardId: Number.isFinite(numericBoardId) ? numericBoardId : 0,
      isLead: member.isLead,
      userId: member.id,
    },
  };
}

async function getMemberWorkloads(editorBoardId: number | string) {
  const workloads = new Map<number, MemberWorkload>();

  try {
    const result = await getEditorBoardProjectsRequest(editorBoardId, {
      field: 'createdAt',
      limit: 100,
      order: 'desc',
      page: 1,
    });

    await Promise.all(
      result.projects.map(async (project) => {
        const projectMembers = await getProjectMembers(project.id, {
          field: 'displayName',
          limit: 100,
          order: 'asc',
          page: 1,
        });

        projectMembers.members.forEach((member) => {
          const current = workloads.get(member.id) ?? {
            activeProjects: 0,
            reviewLoad: 0,
          };

          workloads.set(member.id, {
            activeProjects: current.activeProjects + 1,
            reviewLoad:
              current.reviewLoad + (member.taskOverview?.review ?? member.numberOfTasks ?? 0),
          });
        });
      }),
    );
  } catch {
    return workloads;
  }

  return workloads;
}

export async function getEditorialMembers(editorBoardId: number | string) {
  try {
    const result = await getEditorBoardMembersRequest(editorBoardId, {
      field: 'displayName',
      limit: 50,
      order: 'asc',
      page: 1,
    });

    const workloads = await getMemberWorkloads(editorBoardId);

    return result.members.map((member) =>
      mapBoardMember(member, editorBoardId, workloads.get(member.id)),
    );
  } catch {
    return [];
  }
}

export async function getEditorialMembersSummary(editorBoardId: number | string) {
  const boardMembers = await getEditorialMembers(editorBoardId);

  return {
    activeMembers: boardMembers.filter((member) => member.status !== 'OFFLINE').length,
    availableMembers: boardMembers.filter((member) => member.status === 'AVAILABLE').length,
    leadMembers: boardMembers.filter((member) => member.isLead).length,
    reviewLoad: boardMembers.reduce((total, member) => total + member.reviewLoad, 0),
    totalMembers: boardMembers.length,
  } satisfies EditorialMembersSummary;
}

function getActivityType(action: ActivityLogResponse['action']): MemberActivity['type'] {
  if (action.includes('COMMENT')) {
    return 'COMMENT';
  }

  if (action.includes('TASK') || action.includes('APPLICATION')) {
    return 'REVIEW';
  }

  return 'STATUS';
}

function formatActionTitle(action: ActivityLogResponse['action']) {
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getActivityDescription(activity: ActivityLogResponse) {
  const entityLabel = activity.entityType.toLowerCase().split('_').join(' ');

  return `${formatActionTitle(activity.action)} on ${entityLabel} #${activity.entityId}.`;
}

export async function getEditorialMemberActivities(editorBoardId?: number | string) {
  if (editorBoardId) {
    try {
      const result = await getActivityLogs({
        editorBoardId: Number(editorBoardId),
        limit: 3,
        page: 1,
      });

      return result.activities.map(
        (activity) =>
          ({
            description: getActivityDescription(activity),
            id: activity.id,
            memberName:
              activity.actor?.displayName ?? activity.actor?.email ?? `User #${activity.actorId}`,
            timestamp: activity.createdAt,
            title: formatActionTitle(activity.action),
            type: getActivityType(activity.action),
          }) satisfies MemberActivity,
      );
    } catch {
      return [];
    }
  }

  return [];
}

export async function getAvailableEditorialUsers() {
  try {
    return await getUsers();
  } catch {
    return [] satisfies UserResponse[];
  }
}

export async function addEditorialMembers(editorBoardId: number | string, userIds: number[]) {
  await addEditorBoardMembers(editorBoardId, { userIds });
}

export async function removeEditorialMember(editorBoardId: number | string, userId: number) {
  await removeEditorBoardMember(editorBoardId, userId);
}

export async function setEditorialMemberAsLead(editorBoardId: number | string, userId: number) {
  try {
    const member = await setEditorBoardMemberLead(editorBoardId, userId);
    return mapBoardMember(member, editorBoardId);
  } catch {
    return null;
  }
}
