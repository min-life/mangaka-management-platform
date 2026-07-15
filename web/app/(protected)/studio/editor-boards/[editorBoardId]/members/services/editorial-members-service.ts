import {
  addEditorBoardMembers,
  getEditorBoardMembers as getEditorBoardMembersRequest,
  leaveEditorBoard,
  removeEditorBoardMember,
  setEditorBoardMemberLead,
  type BoardMemberResponse,
} from '@/services/editor-board.service';
import { getUsers, type UserResponse } from '@/services/user.service';

export type EditorialMember = {
  avatarUrl: string | null;
  displayName: string | null;
  email: string;
  id: number;
  isLead: boolean;
  joinedAt?: string;
  lastActiveAt?: string;
  roleTitle: string;
  userEditorBoard: {
    editorBoardId: number;
    isLead: boolean;
    userId: number;
  };
};

function mapBoardMember(
  member: BoardMemberResponse,
  editorBoardId: number | string,
): EditorialMember {
  const memberName = member.displayName ?? member.email ?? 'Board Member';
  const numericBoardId = Number(editorBoardId);

  return {
    avatarUrl: member.avatarUrl ?? null,
    displayName: member.displayName ?? memberName,
    email: member.email ?? `${member.id}@inkly.local`,
    id: member.id,
    isLead: member.isLead,
    joinedAt: member.createdAt,
    lastActiveAt: member.updatedAt,
    roleTitle: member.isLead ? 'Lead Editor' : 'Editorial Member',
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
    return [];
  }
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

export async function leaveEditorialBoard(editorBoardId: number | string) {
  await leaveEditorBoard(editorBoardId);
}

export async function setEditorialMemberAsLead(editorBoardId: number | string, userId: number) {
  try {
    const member = await setEditorBoardMemberLead(editorBoardId, userId);
    return mapBoardMember(member, editorBoardId);
  } catch {
    return null;
  }
}
