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
  assigneeId?: number;
  createdByUserId?: number | null;
  description: string;
  dueDate: string;
  fileId: number;
  fileTitle: string;
  id: string;
  isMine: boolean;
  previewUrl: string;
  priority: TaskPriority;
  region?: TaskRegion;
  status: TaskStatus;
  submissions: TaskSubmission[];
  targetVersion?: string;
  title: string;
  updatedAt: string;
  parent?: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
  } | null;
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
