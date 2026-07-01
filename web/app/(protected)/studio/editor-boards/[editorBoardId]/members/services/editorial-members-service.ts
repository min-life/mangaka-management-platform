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

import { memberActivities, members } from '../const/members';

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

const MOCK_DELAY = 160;

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function wait() {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
}

function getStatus(memberId: number): MemberStatus {
  if (memberId % 5 === 0) {
    return 'OFFLINE';
  }

  return memberId % 2 === 0 ? 'BUSY' : 'AVAILABLE';
}

type MemberWorkload = {
  activeProjects: number;
  reviewLoad: number;
};

function getStatusFromWorkload(workload: MemberWorkload | undefined, fallbackMemberId: number): MemberStatus {
  if (!workload) {
    return getStatus(fallbackMemberId);
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
    activeProjects: workload?.activeProjects ?? (member.isLead ? 8 : 3 + (member.id % 4)),
    avatarUrl: member.avatarUrl ?? null,
    displayName: member.displayName ?? memberName,
    email: member.email ?? `${member.id}@inkly.local`,
    id: member.id,
    isLead: member.isLead,
    joinedAt: member.createdAt,
    lastActiveAt: member.updatedAt,
    region: member.isLead ? 'Editorial Lead Desk' : 'Editorial Desk',
    reviewLoad: workload?.reviewLoad ?? (member.isLead ? 12 : 2 + (member.id % 8)),
    roleTitle: member.isLead ? 'Lead Editor' : 'Editorial Member',
    status: getStatusFromWorkload(workload, member.id),
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
        const projectMembers = await getProjectMembers(project.id);

        projectMembers.members.forEach((member) => {
          const current = workloads.get(member.id) ?? {
            activeProjects: 0,
            reviewLoad: 0,
          };

          workloads.set(member.id, {
            activeProjects: current.activeProjects + 1,
            reviewLoad: current.reviewLoad + (member.taskOverview?.review ?? member.numberOfTasks ?? 0),
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

    return result.members.map((member) => mapBoardMember(member, editorBoardId, workloads.get(member.id)));
  } catch {
    await wait();

    return clone(members).map((member) => ({
      ...member,
      userEditorBoard: {
        ...member.userEditorBoard,
        editorBoardId: Number(editorBoardId) || member.userEditorBoard.editorBoardId,
      },
    }));
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
  const entityLabel = activity.entityType
    .toLowerCase()
    .split('_')
    .join(' ');

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
      await wait();
    }
  } else {
    await wait();
  }

  return clone(memberActivities);
}

export async function getAvailableEditorialUsers() {
  try {
    return await getUsers();
  } catch {
    await wait();

    return clone(members).map(
      (member) =>
        ({
          avatarUrl: member.avatarUrl,
          displayName: member.displayName,
          email: member.email,
          id: member.id,
        }) satisfies UserResponse,
    );
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
    await wait();
    return null;
  }
}
