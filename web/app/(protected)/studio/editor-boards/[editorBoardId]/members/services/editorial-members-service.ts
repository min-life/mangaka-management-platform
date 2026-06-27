import {
  addEditorBoardMembers,
  getEditorBoardMembers as getEditorBoardMembersRequest,
  removeEditorBoardMember,
  setEditorBoardMemberLead,
  type BoardMemberResponse,
} from '@/services/editor-board.service';
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

function mapBoardMember(member: BoardMemberResponse, editorBoardId: number | string): EditorialMember {
  const memberName = member.displayName ?? member.email ?? 'Board Member';
  const numericBoardId = Number(editorBoardId);

  return {
    activeProjects: member.isLead ? 8 : 3 + (member.id % 4),
    avatarUrl: member.avatarUrl ?? null,
    displayName: member.displayName ?? memberName,
    email: member.email ?? `${member.id}@inkly.local`,
    id: member.id,
    isLead: member.isLead,
    joinedAt: undefined,
    lastActiveAt: undefined,
    region: member.isLead ? 'Editorial Lead Desk' : 'Editorial Desk',
    reviewLoad: member.isLead ? 12 : 2 + (member.id % 8),
    roleTitle: member.isLead ? 'Lead Editor' : 'Editorial Member',
    status: getStatus(member.id),
    userEditorBoard: {
      editorBoardId: Number.isFinite(numericBoardId) ? numericBoardId : 0,
      isLead: member.isLead,
      userId: member.id,
    },
  };
}

export async function getEditorialMembers(editorBoardId: number | string) {
  try {
    const result = await getEditorBoardMembersRequest(editorBoardId, {
      field: 'displayName',
      limit: 50,
      order: 'asc',
      page: 1,
    });

    return result.members.map((member) => mapBoardMember(member, editorBoardId));
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

export async function getEditorialMemberActivities() {
  await wait();
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
