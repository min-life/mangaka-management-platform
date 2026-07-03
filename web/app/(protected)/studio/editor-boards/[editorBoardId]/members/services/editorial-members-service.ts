import {
  addEditorBoardMembers,
  getEditorBoardMembers as getEditorBoardMembersRequest,
  removeEditorBoardMember,
  setEditorBoardMemberLead,
  type BoardMemberResponse,
} from '@/services/editor-board.service';
import { getUsers } from '@/services/user.service';

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
    activeProjects: 0,
    avatarUrl: member.avatarUrl ?? null,
    displayName: member.displayName ?? memberName,
    email: member.email ?? `${member.id}@inkly.local`,
    id: member.id,
    isLead: member.isLead,
    joinedAt: undefined,
    lastActiveAt: undefined,
    region: member.isLead ? 'Editorial Lead Desk' : 'Editorial Desk',
    reviewLoad: 0,
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
  } catch (err) {
    console.error('Failed to load editorial members:', err);
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

export async function getEditorialMemberActivities() {
  return [] as MemberActivity[];
}

export async function getAvailableEditorialUsers() {
  return await getUsers();
}

export async function addEditorialMembers(editorBoardId: number | string, userIds: number[]) {
  await addEditorBoardMembers(editorBoardId, { userIds });
}

export async function removeEditorialMember(editorBoardId: number | string, userId: number) {
  await removeEditorBoardMember(editorBoardId, userId);
}

export async function setEditorialMemberAsLead(editorBoardId: number | string, userId: number) {
  const member = await setEditorBoardMemberLead(editorBoardId, userId);
  return mapBoardMember(member, editorBoardId);
}
