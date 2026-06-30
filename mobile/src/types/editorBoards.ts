export type EditorBoardRole = 'Owner' | 'Lead' | 'Member';

export interface EditorBoardMember {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: EditorBoardRole;
  joinedAtLabel: string;
}

export interface EditorBoardItem {
  id: string;
  name: string;
  description: string;
  currentUserRole: EditorBoardRole;
  createdBy: string;
  leadMemberId: string;
  projectIds: string[];
  memberIds: string[];
  updatedAtLabel: string;
}

