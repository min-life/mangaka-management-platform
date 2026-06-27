import {
  mockActivities,
  mockCurrentUser,
  mockEditorBoards,
  mockProjects,
} from '../const/mock-data';

export type Scope = 'SYS' | 'PRJ';
export type ProgressStatus = 'PENDING' | 'INPROGRESS' | 'REVIEW' | 'DONE';

export type UserRole = {
  id: number;
  code: string;
  scope: Scope;
  name: string;
  isDefault: boolean;
};

export type UserProfile = {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  googleLinked: boolean;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
};

export type UserProject = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  editorBoardId: number | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  assignedAt: string;
  role: UserRole;
  projectStats: Array<{
    id: number;
    projectId: number;
    metrics: {
      progress: number;
      statusLabel: 'On Track' | 'Revision' | 'Blocked';
    };
    updatedAt: string;
  }>;
};

export type UserEditorBoard = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  isLead: boolean;
};

export type UserActivity = {
  id: number;
  title: string;
  description: string | null;
  status: ProgressStatus;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  timeLabel: string;
};

export type UpdateProfilePayload = {
  displayName: string;
  avatarUrl?: string;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

const MOCK_DELAY = 250;

let currentUserMockState: UserProfile = clone(mockCurrentUser);

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function wait() {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
}

export async function getCurrentUserProfile() {
  await wait();
  return clone(currentUserMockState);
}

export async function getCurrentUserProjects() {
  await wait();
  return clone(mockProjects);
}

export async function getCurrentUserEditorBoards() {
  await wait();
  return clone(mockEditorBoards);
}

export async function getCurrentUserActivities() {
  await wait();
  return clone(mockActivities);
}

export async function updateCurrentUserProfile(payload: UpdateProfilePayload) {
  await wait();
  currentUserMockState = {
    ...currentUserMockState,
    displayName: payload.displayName,
    avatarUrl: payload.avatarUrl ?? currentUserMockState.avatarUrl,
    updatedAt: new Date().toISOString(),
  };

  return clone(currentUserMockState);
}

export async function updateCurrentUserPassword(_payload: UpdatePasswordPayload) {
  await wait();
  return { success: true };
}

export async function uploadAvatarToCloudinaryMock(file: File) {
  await wait();
  return {
    publicId: `mock-cloudinary/avatar/${crypto.randomUUID()}`,
    avatarUrl: URL.createObjectURL(file),
  };
}
