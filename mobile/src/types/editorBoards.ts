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
  createdByName: string;
  createdAtLabel: string;
  imageUrl?: string | null;
  leadMemberId: string;
  projectIds: string[];
  projectCount: number;
  memberIds: string[];
  updatedByName: string;
  updatedAtLabel: string;
}

