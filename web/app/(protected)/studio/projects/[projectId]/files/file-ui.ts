import type { ProjectFolderResponse } from '@/services/project.service';

export const FILES_LOCAL_STORAGE_KEY = 'inkly:file-module-local-files';

// Temporary UI review mode. Set to false when task submit/review permissions are finalized.
export const FILE_UI_PREVIEW_ALL_ACTIONS = true;

export type FileStatus = 'DONE' | 'INPROGRESS' | 'PENDING' | 'REVIEW';

export type FileExplorerItem = {
  category: string;
  createdAt: string;
  createdByLabel: string;
  description: string | null;
  folderId: number;
  id: number;
  isFallback: boolean;
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
  title: string;
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
  time: string;
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
  note: string;
  previewUrl?: string;
  version: number;
};

export const fallbackFileWorkspaceMeta = {
  assignedTo: 'Sarah Jenkins *',
  dueDate: 'Jun 25, 2026 *',
  reviewRequests: 2,
  reviewStatus: 'Pending *',
  version: 'v5 *',
};

export const fallbackFileActivity: FileActivityItem[] = [
  {
    actor: 'Sarah Jenkins *',
    id: 'activity-1',
    label: 'updated the file preview *',
    time: '2h ago *',
    tone: 'default',
  },
  {
    actor: 'Lead Editor *',
    id: 'activity-2',
    label: 'submitted a review request *',
    time: '4h ago *',
    tone: 'warning',
  },
  {
    actor: 'Production System *',
    id: 'activity-3',
    label: 'moved Line Art to Review *',
    time: '1d ago *',
    tone: 'success',
  },
];

export const fallbackFileVersions: FileVersionItem[] = [
  {
    author: 'Sarah Jenkins *',
    createdAt: '2h ago *',
    id: 'version-5',
    isCurrent: true,
    note: 'Approved coloring pass *',
    previewUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1400&auto=format&fit=crop',
    version: 5,
  },
  {
    author: 'Assistant Artist *',
    createdAt: 'Yesterday *',
    id: 'version-4',
    isCurrent: false,
    note: 'Assistant submission *',
    previewUrl:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1400&auto=format&fit=crop',
    version: 4,
  },
  {
    author: 'Lead Artist *',
    createdAt: 'Jun 18 *',
    id: 'version-3',
    isCurrent: false,
    note: 'Storyboard revision *',
    previewUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop',
    version: 3,
  },
  {
    author: 'Mangaka *',
    createdAt: 'Jun 16 *',
    id: 'version-2',
    isCurrent: false,
    note: 'Panel layout updated *',
    version: 2,
  },
  {
    author: 'Mangaka *',
    createdAt: 'Jun 15 *',
    id: 'version-1',
    isCurrent: false,
    note: 'Initial draft *',
    version: 1,
  },
];

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

const fallbackTemplates = [
  {
    category: 'Storyboard',
    description: 'Panel composition and camera direction for the current chapter. *',
    status: 'REVIEW' as const,
    taskCount: 2,
    title: 'Chapter Storyboard *',
    previewUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1400&auto=format&fit=crop',
  },
  {
    category: 'Line Art',
    description: 'Primary ink pass and character line cleanup. *',
    status: 'INPROGRESS' as const,
    taskCount: 5,
    title: 'Line Art Production *',
    previewUrl:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1400&auto=format&fit=crop',
  },
  {
    category: 'Lettering',
    description: 'Dialogue, captions, and speech bubble layout. *',
    status: 'PENDING' as const,
    taskCount: 3,
    title: 'Lettering Pass *',
    previewUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop',
  },
];

const demoProductionFolders = [
  { id: -9001, parentId: null, title: 'Arc 1' },
  { id: -9011, parentId: -9001, title: 'Chapter 01' },
  { id: -9012, parentId: -9001, title: 'Chapter 02' },
  { id: -9013, parentId: -9001, title: 'Chapter 03' },
  { id: -9014, parentId: -9001, title: 'Chapter 04' },
  { id: -9002, parentId: null, title: 'Arc 2' },
  { id: -9021, parentId: -9002, title: 'Chapter 05' },
  { id: -9022, parentId: -9002, title: 'Chapter 06' },
  { id: -9023, parentId: -9002, title: 'Chapter 07' },
  { id: -9024, parentId: -9002, title: 'Chapter 08' },
  { id: -9003, parentId: null, title: 'One Shot' },
  { id: -9031, parentId: -9003, title: 'Chapter 01' },
  { id: -9032, parentId: -9003, title: 'Chapter 02' },
  { id: -9101, parentId: null, title: 'Assets' },
  { id: -9111, parentId: -9101, title: 'Characters' },
  { id: -9112, parentId: -9101, title: 'Backgrounds' },
  { id: -9113, parentId: -9101, title: 'References' },
];

export function buildDemoProductionFolders(
  projectId: number,
  folders: ProjectFolderResponse[],
): ProjectFolderResponse[] {
  const rootTitles = new Set(
    folders
      .filter((folder) => !folder.parentId)
      .map((folder) => folder.title.trim().toLowerCase()),
  );
  const hasStoryArc = [...rootTitles].some(
    (title) => title.includes('arc') || title.includes('one shot'),
  );

  if (hasStoryArc && folders.length >= 8) {
    return folders;
  }

  const now = new Date().toISOString();
  const demoFolders: ProjectFolderResponse[] = demoProductionFolders.map((folder) => ({
    createdAt: now,
    createdBy: null,
    description: 'Demo production folder for UI preview. *',
    id: folder.id,
    parentId: folder.parentId,
    projectId,
    title: `${folder.title} *`,
    updatedAt: now,
    updatedBy: null,
  }));

  return [...folders, ...demoFolders];
}

export function buildFallbackFiles(folders: ProjectFolderResponse[]): FileExplorerItem[] {
  const folderIds = new Set(folders.map((folder) => folder.id));
  const rootFolders = folders.filter((folder) => !folder.parentId || !folderIds.has(folder.parentId));
  const rootIds = new Set(rootFolders.map((folder) => folder.id));
  const targetFolders = folders
    .filter((folder) => folder.parentId && !rootIds.has(folder.id))
    .slice(0, 16);
  const fileTargetFolders = targetFolders.length ? targetFolders : folders.slice(0, 4);

  return fileTargetFolders.flatMap((folder, folderIndex) =>
    fallbackTemplates.slice(0, folderIndex % 3 === 0 ? 3 : 2).map((template, itemIndex) => ({
      ...template,
      createdAt: folder.createdAt,
      createdByLabel: 'Project member *',
      folderId: folder.id,
      id: -(folderIndex * 10 + itemIndex + 1),
      isFallback: true,
      updatedAt: folder.updatedAt,
    })),
  );
}

export const fallbackMaterials: FileMaterialItem[] = [
  { id: 'material-1', name: 'Character Reference *', type: 'REFERENCE' },
  { id: 'material-2', name: 'Lighting Concept *', type: 'CONCEPT_ART' },
];

export const fallbackTasks: FileTaskItem[] = [
  {
    assignedTo: 'Project member *',
    description: 'Refine panel composition and visual flow. *',
    dueDate: 'Jun 25, 2026 *',
    id: 'task-1',
    region: { endX: 0.52, endY: 0.62, startX: 0.24, startY: 0.18 },
    status: 'INPROGRESS',
    title: 'Refine panel composition *',
  },
  {
    assignedTo: 'Project member *',
    description: 'Check lettering density before review. *',
    dueDate: 'Jun 26, 2026 *',
    id: 'task-2',
    region: { endX: 0.84, endY: 0.76, startX: 0.58, startY: 0.48 },
    status: 'PENDING',
    title: 'Check lettering density *',
  },
];

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
