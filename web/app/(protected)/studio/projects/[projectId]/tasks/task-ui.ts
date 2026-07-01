export type TaskPriority = 'HIGH' | 'LOW' | 'MEDIUM';
export type TaskStatus = 'DONE' | 'INPROGRESS' | 'PENDING' | 'REVIEW';
export type SubmissionStatus = 'APPROVED' | 'CHANGES_REQUESTED' | 'NONE' | 'PENDING_REVIEW';

export type TaskRegion = {
  endX: number;
  endY: number;
  startX: number;
  startY: number;
};

export type TaskSubmission = {
  assetName: string;
  id: string;
  note: string;
  previewUrl?: string;
  status: SubmissionStatus;
  submittedAt: string;
  submittedBy: string;
};

export type TaskWorkspaceItem = {
  assignee: string;
  description: string;
  dueDate: string;
  fileId: number;
  fileTitle: string;
  id: string;
  isFallback: boolean;
  isMine: boolean;
  previewUrl: string;
  priority: TaskPriority;
  region?: TaskRegion;
  status: TaskStatus;
  submissions: TaskSubmission[];
  targetVersion?: string;
  title: string;
  updatedAt: string;
};

export const TASKS_LOCAL_STORAGE_KEY = 'inkly:task-module-local-tasks';
export const TASK_OVERRIDES_STORAGE_KEY = 'inkly:task-module-overrides';

export const taskStatusLabels: Record<TaskStatus, string> = {
  DONE: 'Done',
  INPROGRESS: 'In Progress',
  PENDING: 'Pending',
  REVIEW: 'Review',
};

export const taskStatusClassName: Record<TaskStatus, string> = {
  DONE: 'border-[#315846] bg-[#14291f] text-[#9df2c7]',
  INPROGRESS: 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]',
  PENDING: 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]',
  REVIEW: 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
};

export const taskPriorityClassName: Record<TaskPriority, string> = {
  HIGH: 'border-[#6b2637] bg-[#371522] text-[#ff9ab3]',
  LOW: 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]',
  MEDIUM: 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
};

const previewUrls = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop',
];

export const fallbackProjectTasks: TaskWorkspaceItem[] = [
  {
    assignee: 'Kaito Yamamoto *',
    description: 'Refine the face, hair, and costume detail in the selected character region. *',
    dueDate: 'Jun 23, 2026 *',
    fileId: -2,
    fileTitle: 'Line Art Production *',
    id: 'task-101',
    isFallback: true,
    isMine: true,
    previewUrl: previewUrls[0],
    priority: 'HIGH',
    region: { endX: 0.55, endY: 0.67, startX: 0.24, startY: 0.16 },
    status: 'INPROGRESS',
    submissions: [],
    title: 'Refine character line art *',
    updatedAt: '2h ago *',
  },
  {
    assignee: 'Hana Tanaka *',
    description: 'Apply the approved dialogue and balance speech bubble density. *',
    dueDate: 'Jun 24, 2026 *',
    fileId: -3,
    fileTitle: 'Lettering Pass *',
    id: 'task-102',
    isFallback: true,
    isMine: true,
    previewUrl: previewUrls[1],
    priority: 'MEDIUM',
    region: { endX: 0.87, endY: 0.78, startX: 0.58, startY: 0.46 },
    status: 'REVIEW',
    submissions: [
      {
        assetName: 'chapter-01-lettering-v2.png *',
        id: 'submission-102',
        note: 'Updated bubbles and reduced dialogue density. *',
        previewUrl:
          'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1400&auto=format&fit=crop',
        status: 'PENDING_REVIEW',
        submittedAt: '45m ago *',
        submittedBy: 'Hana Tanaka *',
      },
    ],
    title: 'Dialogue lettering pass *',
    updatedAt: '45m ago *',
  },
  {
    assignee: 'Akira Tanaka *',
    description: 'Add ink detail and atmospheric depth to the background panels. *',
    dueDate: 'Jun 26, 2026 *',
    fileId: -2,
    fileTitle: 'Line Art Production *',
    id: 'task-103',
    isFallback: true,
    isMine: false,
    previewUrl: previewUrls[2],
    priority: 'HIGH',
    region: { endX: 0.92, endY: 0.52, startX: 0.52, startY: 0.08 },
    status: 'PENDING',
    submissions: [],
    title: 'Ink background panels *',
    updatedAt: '1d ago *',
  },
  {
    assignee: 'Ren Editor *',
    description: 'Verify screentone consistency before publication review. *',
    dueDate: 'Jun 20, 2026 *',
    fileId: -1,
    fileTitle: 'Chapter Storyboard *',
    id: 'task-104',
    isFallback: true,
    isMine: false,
    previewUrl: previewUrls[0],
    priority: 'LOW',
    status: 'DONE',
    submissions: [
      {
        assetName: 'screentone-final.png *',
        id: 'submission-104',
        note: 'Final consistency pass complete. *',
        previewUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop',
        status: 'APPROVED',
        submittedAt: '2d ago *',
        submittedBy: 'Ren Editor *',
      },
    ],
    title: 'Final screentone check *',
    updatedAt: '2d ago *',
  },
  {
    assignee: 'Kaito Yamamoto *',
    description: 'Prepare the final cover color treatment for editorial review. *',
    dueDate: 'Jun 18, 2026 *',
    fileId: -1,
    fileTitle: 'Chapter Storyboard *',
    id: 'task-105',
    isFallback: true,
    isMine: true,
    previewUrl: previewUrls[1],
    priority: 'HIGH',
    status: 'PENDING',
    submissions: [],
    title: 'Cover color grading *',
    updatedAt: '3d ago *',
  },
];

export function readStoredTasks(): TaskWorkspaceItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedTasks = window.sessionStorage.getItem(TASKS_LOCAL_STORAGE_KEY);
  if (!storedTasks) {
    return [];
  }

  try {
    return JSON.parse(storedTasks) as TaskWorkspaceItem[];
  } catch {
    return [];
  }
}

export function writeStoredTasks(tasks: TaskWorkspaceItem[]) {
  window.sessionStorage.setItem(TASKS_LOCAL_STORAGE_KEY, JSON.stringify(tasks));
}

export function readTaskOverrides(): Record<string, TaskWorkspaceItem> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(TASK_OVERRIDES_STORAGE_KEY) ?? '{}') as Record<
      string,
      TaskWorkspaceItem
    >;
  } catch {
    return {};
  }
}

export function writeTaskOverride(task: TaskWorkspaceItem) {
  window.sessionStorage.setItem(
    TASK_OVERRIDES_STORAGE_KEY,
    JSON.stringify({ ...readTaskOverrides(), [task.id]: task }),
  );
}
