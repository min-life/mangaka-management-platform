import type { Dispatch, SetStateAction } from 'react';
import type { FileExplorerItem, FileTaskItem, FileVersionItem } from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

export type SubmitTaskWorkInput = {
  image?: File;
  note: string;
  source?: File;
  text?: File;
};

export type FileTaskSidebarProps = {
  annotationMode: boolean;
  canCreateTask: boolean;
  canReviewTask: boolean;
  canSubmitTask: boolean;
  file: FileExplorerItem;
  focusedTask: TaskWorkspaceItem | null;
  onCloseFocusedTask: () => void;
  onCreateTask: () => void;
  onSelectTask: (taskId: string | null) => void;
  onStartFrameComment: () => void;
  onSubmitTaskWork: (input: SubmitTaskWorkInput) => void;
  onMarkReadyForReview?: () => Promise<void>;
  onTaskChange: (task: TaskWorkspaceItem) => void;
  selectedTaskId: string | null;
  selectedVersion: FileVersionItem | null;
  tasks: FileTaskItem[];
  versions: FileVersionItem[];
  members?: Array<{ id: number; name: string }>;
  onRefresh?: () => void | Promise<void>;
  discussionContextKey: string;
  setDiscussionContext: (key: string) => void;
  commentFilterMode: string;
  setCommentFilterMode: Dispatch<SetStateAction<string>>;
  discussionFrameComments: any[];
};

export type DesktopTaskSidebarProps = FileTaskSidebarProps & {
  isOpen: boolean;
  onClose: () => void;
};

export type MobileTaskDrawerProps = FileTaskSidebarProps & {
  onClose: () => void;
  open: boolean;
};
