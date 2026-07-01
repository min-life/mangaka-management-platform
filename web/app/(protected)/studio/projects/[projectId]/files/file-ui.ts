import type { ProjectFolderResponse } from '@/services/project.service';
import type { TaskSubmission } from '../tasks/task-ui';


export const FILES_LOCAL_STORAGE_KEY = 'inkly:file-module-local-files';

export type FileStatus = 'DONE' | 'INPROGRESS' | 'PENDING' | 'REVIEW';

export type FileExplorerItem = {
  category: string;
  createdAt: string;
  createdByLabel: string;
  description: string | null;
  folderId: number;
  id: number;
  previewUrl?: string;
  status: FileStatus;
  taskCount: number;
  title: string;
  updatedAt: string;
};

export type FileMaterialItem = {
  id: string;
  name: string;
  type: string;
  url?: string;
};

export type FileTaskItem = {
  assignedTo: string;
  description: string;
  dueDate?: string;
  id: string;
  region?: FileTaskRegion;
  status: FileStatus;
  targetVersion?: string;
  title: string;
  submissions?: TaskSubmission[];
  parent?: {
    id: string;
    title: string;
    description: string | null;
    status: FileStatus;
  } | null;
};

export type FileTaskRegion = {
  endX: number;
  endY: number;
  startX: number;
  startY: number;
};

export type SubmissionFrameComment = {
  author: string;
  content: string;
  id: string;
  region: FileTaskRegion;
  submissionId: string;
  taskId?: string;
  time: string;
  version?: string;
};

export type FileActivityItem = {
  actor: string;
  id: string;
  label: string;
  time: string;
  tone: 'default' | 'success' | 'warning';
};

export type FileVersionItem = {
  author: string;
  createdAt: string;
  id: string;
  isCurrent: boolean;
  materials?: unknown[];
  note: string;
  previewUrl?: string;
  version: number;
};

export const fileStatusLabels: Record<FileStatus, string> = {
  DONE: 'Done',
  INPROGRESS: 'In Progress',
  PENDING: 'Pending',
  REVIEW: 'In Review',
};

export const fileStatusClassName: Record<FileStatus, string> = {
  DONE: 'border-[#315846] bg-[#14291f] text-[#9df2c7]',
  INPROGRESS: 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]',
  PENDING: 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]',
  REVIEW: 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
};

export function formatFileDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
