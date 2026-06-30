import { APPLICATIONS } from '@/src/constants/applicationsData';
import { EditorBoardItem, EditorBoardMember } from '@/src/types/editorBoards';

export const EDITOR_BOARD_MEMBERS: EditorBoardMember[] = [
  {
    id: 'mika',
    initials: 'MK',
    name: 'Mika Lead',
    email: 'mika@mangaka.app',
    role: 'Lead',
    joinedAtLabel: 'Joined 8mo ago',
  },
  {
    id: 'ren',
    initials: 'RE',
    name: 'Ren Editor',
    email: 'ren@mangaka.app',
    role: 'Owner',
    joinedAtLabel: 'Created board',
  },
  {
    id: 'aya',
    initials: 'AY',
    name: 'Aya Reviewer',
    email: 'aya@mangaka.app',
    role: 'Member',
    joinedAtLabel: 'Joined 3mo ago',
  },
  {
    id: 'toma',
    initials: 'TO',
    name: 'Toma Proofreader',
    email: 'toma@mangaka.app',
    role: 'Member',
    joinedAtLabel: 'Joined 6w ago',
  },
  {
    id: 'nari',
    initials: 'NA',
    name: 'Nari Coordinator',
    email: 'nari@mangaka.app',
    role: 'Lead',
    joinedAtLabel: 'Joined 1y ago',
  },
];

export const EDITOR_BOARDS: EditorBoardItem[] = [
  {
    id: 'shonen-board',
    name: 'Shonen Editorial Board',
    description:
      'Handles high-energy manga chapters, final manuscript review, and weekly publish requests.',
    currentUserRole: 'Lead',
    createdBy: 'ren',
    leadMemberId: 'mika',
    projectIds: ['dragon-blade', 'night-market'],
    memberIds: ['ren', 'mika', 'aya', 'toma'],
    updatedAtLabel: 'Updated 30m ago',
  },
  {
    id: 'seinen-board',
    name: 'Seinen Editorial Board',
    description:
      'Reviews tonal consistency, mature story arcs, and publication readiness for seinen projects.',
    currentUserRole: 'Member',
    createdBy: 'nari',
    leadMemberId: 'nari',
    projectIds: ['moonlight-ronin'],
    memberIds: ['nari', 'aya', 'toma'],
    updatedAtLabel: 'Updated yesterday',
  },
  {
    id: 'production-tools',
    name: 'Production Tools',
    description:
      'Coordinates internal tooling releases and workflow improvements for production teams.',
    currentUserRole: 'Owner',
    createdBy: 'ren',
    leadMemberId: 'ren',
    projectIds: ['frame-cleaner', 'lettering-queue'],
    memberIds: ['ren', 'mika', 'nari'],
    updatedAtLabel: 'Updated 3h ago',
  },
];

export function findEditorBoard(boardId: string) {
  return EDITOR_BOARDS.find((board) => board.id === boardId);
}

export function getBoardMembers(board: EditorBoardItem) {
  return board.memberIds
    .map((memberId) => EDITOR_BOARD_MEMBERS.find((member) => member.id === memberId))
    .filter((member): member is EditorBoardMember => Boolean(member));
}

export function getBoardPublishRequests(board: EditorBoardItem) {
  const projectIdSet = new Set(board.projectIds);
  return APPLICATIONS.filter(
    (application) =>
      application.type === 'PUBLISH_REQUEST' && projectIdSet.has(application.projectId),
  );
}

