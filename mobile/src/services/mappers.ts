import { Colors } from '@/src/constants/colors';
import { ApplicationItem, ApplicationStatus } from '@/src/types/applications';
import { EditorBoardItem, EditorBoardMember } from '@/src/types/editorBoards';
import {
  ProjectItem,
  ProjectTaskSummary,
  ProjectType,
} from '@/src/types/projects';
import {
  ResourceFileMaterialVersion,
  ResourceFileNode,
  ResourceFileTask,
  ResourceFolderNode,
  ResourceTaskComment,
  ResourceTaskFrame,
} from '@/src/types/resources';
import { NotificationItem, NotificationSection } from '@/src/types/notifications';
import { Task, TaskStatus } from '@/src/screens/tasks/components/types';

import {
  ApiApplication,
  ApiComment,
  ApiEditorBoard,
  ApiFile,
  ApiFolder,
  ApiFrame,
  ApiMaterial,
  ApiNotification,
  ApiProject,
  ApiTask,
  ApiTaskStatus,
  ApiUserSummary,
} from './apiTypes';
import { absoluteDate, displayName, initials, relativeDate } from './formatters';

const FALLBACK_AVATAR =
  'https://i.pravatar.cc/160?img=1';

function projectTypeFromName(name: string): ProjectType {
  const normalized = name.toLowerCase();
  if (normalized.includes('tool')) return 'Tooling';
  if (normalized.includes('service')) return 'Service';
  return 'Manga';
}

function taskSummary(tasks: ApiTask[] = []): ProjectTaskSummary {
  return tasks.reduce(
    (summary, task) => {
      if (task.status === 'DONE') summary.done += 1;
      else if (task.status === 'INPROGRESS') summary.inProgress += 1;
      else if (task.status === 'REVIEW') summary.review += 1;
      else summary.pending += 1;
      return summary;
    },
    { done: 0, inProgress: 0, pending: 0, review: 0 },
  );
}

export function mapProject(
  project: ApiProject,
  extras: {
    applications?: ApiApplication[];
    board?: ApiEditorBoard | null;
    folders?: ApiFolder[];
    stats?: Record<string, unknown> | null;
    tasks?: ApiTask[];
  } = {},
): ProjectItem {
  const creator = displayName(project.createdByUser);
  const completionRate =
    Number(extras.stats?.progress ?? extras.stats?.completionRate ?? extras.stats?.completedTasks) || 0;
  const tasks = taskSummary(extras.tasks);

  return {
    activeMembers: project.userProjects?.length ?? project._count?.userProjects ?? 0,
    applications: {
      approved: extras.applications?.filter((item) => item.status === 'APPROVE').length ?? 0,
      cancelled: extras.applications?.filter((item) => item.status === 'CANCELLED').length ?? 0,
      pending:
        extras.applications?.filter((item) =>
          ['INTERNAL_APPROVED', 'PENDING', 'SUBMITTED'].includes(item.status),
        ).length ?? project._count?.applications ?? 0,
      rejected: extras.applications?.filter((item) => item.status === 'REJECT').length ?? 0,
    },
    avatarBg: Colors.surfaceContainer,
    avatarInitials: initials(project.name),
    branch: 'main',
    contributors: project.userProjects?.length ?? project._count?.userProjects ?? 0,
    coverUri: project.imageUrl ?? undefined,
    createdAt: project.createdAt,
    createdBy: String(project.createdBy ?? project.createdByUser?.id ?? ''),
    createdByName: creator,
    currentUserRole: project.userProjects?.[0]?.role?.name ?? 'Member',
    description: project.description ?? undefined,
    editorBoard: extras.board?.name ?? project.editorBoard?.name ?? 'No editor board',
    editorBoardLeaderInitials: initials(extras.board?.createdByUser?.displayName),
    editorBoardLeaderName: displayName(extras.board?.createdByUser),
    editorBoardLeaderAvatarUri: extras.board?.createdByUser?.avatarUrl ?? undefined,
    files: project._count?.files ?? 0,
    forks: 0,
    id: String(project.id),
    language: projectTypeFromName(project.name),
    languageColor: Colors.accent,
    materials: project._count?.materials ?? 0,
    name: project.name,
    owner: creator,
    rootFolders: extras.folders?.filter((folder) => !folder.parent && !folder.parentId).length ?? 0,
    stars: project.userProjects?.length ?? 0,
    stats: {
      completionRate: Math.min(100, Math.max(0, completionRate)),
      frameComments: Number(extras.stats?.frameComments ?? 0),
      lastUpdated: `Updated ${relativeDate(project.updatedAt)}`,
      pagesReviewed: Number(extras.stats?.pagesReviewed ?? extras.stats?.completedTasks ?? 0),
    },
    tasks,
    type: projectTypeFromName(project.name),
    updatedAt: project.updatedAt,
    url: `project-${project.id}`,
  };
}

export function mapEditorBoard(board: ApiEditorBoard): EditorBoardItem {
  return {
    createdBy: String(board.createdBy ?? board.createdByUser?.id ?? ''),
    currentUserRole: 'Member',
    description: board.description ?? 'Editor board workspace.',
    id: String(board.id),
    leadMemberId: String(board.createdBy ?? board.createdByUser?.id ?? ''),
    memberIds: Array.from({ length: board._count?.members ?? 0 }, (_, index) => `member-${index}`),
    name: board.name,
    projectIds: Array.from({ length: board._count?.projects ?? 0 }, (_, index) => `project-${index}`),
    updatedAtLabel: `Updated ${relativeDate(board.updatedAt)}`,
  };
}

export function mapBoardMember(item: { user?: ApiUserSummary; isLead?: boolean }): EditorBoardMember {
  const user = item.user;
  const name = displayName(user);

  return {
    email: user?.email ?? '',
    id: String(user?.id ?? name),
    initials: initials(name),
    joinedAtLabel: item.isLead ? 'Lead member' : 'Board member',
    name,
    role: item.isLead ? 'Lead' : 'Member',
  };
}

function normalizeApplicationStatus(status: ApiApplication['status']): ApplicationStatus {
  if (status === 'APPROVE') return 'APPROVE';
  if (status === 'REJECT') return 'REJECT';
  if (status === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}

export function mapApplication(application: ApiApplication): ApplicationItem {
  const rawMaterials = Array.isArray(application.materials) ? application.materials : [];

  return {
    createdAtLabel: absoluteDate(application.createdAt),
    createdBy: displayName(application.createdByUser),
    description: application.description ?? '',
    id: String(application.id),
    materials: {
      note: rawMaterials.length > 0 ? `${rawMaterials.length} linked material item(s).` : '',
      pages: rawMaterials.map((item, index) => ({
        fileName: `Material ${index + 1}`,
        id: `${application.id}-material-${index}`,
        status: 'Ready',
        title:
          typeof item === 'object' && item && 'title' in item
            ? String((item as { title?: unknown }).title)
            : `Material ${index + 1}`,
      })),
    },
    projectId: String(
      application.projectId ??
        (application.project && 'id' in application.project ? application.project.id : ''),
    ),
    status: normalizeApplicationStatus(application.status),
    title: application.title,
    type: application.type,
    updatedAtLabel: `Updated ${relativeDate(application.updatedAt)}`,
    verifyBy: application.verifiedByUser ? displayName(application.verifiedByUser) : undefined,
  };
}

export function mapFolder(folder: ApiFolder, children: Array<ResourceFolderNode | ResourceFileNode> = []): ResourceFolderNode {
  return {
    children,
    createdAt: folder.createdAt,
    createdBy: String(folder.createdBy ?? folder.createdByUser?.id ?? ''),
    createdByName: displayName(folder.createdByUser),
    description: folder.description ?? undefined,
    id: String(folder.id),
    name: folder.title,
    parentId: folder.parentId === undefined ? (folder.parent ? String(folder.parent.id) : null) : folder.parentId === null ? null : String(folder.parentId),
    projectId: folder.projectId === undefined ? (folder.project ? String(folder.project.id) : undefined) : String(folder.projectId),
    type: 'folder',
    updatedAt: folder.updatedAt,
  };
}

export function materialImage(material?: Record<string, unknown>) {
  const pages = Array.isArray(material?.pages) ? material.pages : [];
  const firstPage = pages[0] as { url?: unknown } | undefined;
  return String(material?.imageUri ?? material?.thumbnailUrl ?? firstPage?.url ?? 'https://picsum.photos/seed/mangaka-material/900/1200');
}

export function mapMaterialVersion(material: ApiMaterial): ResourceFileMaterialVersion {
  const raw = material.materials ?? {};

  return {
    createdAt: material.createdAt,
    createdBy: String(material.createdBy ?? material.createdByUser?.id ?? ''),
    createdByName: displayName(material.createdByUser),
    fileId: String(material.fileId ?? material.file?.id ?? ''),
    id: String(material.id),
    materials: {
      editorState: typeof raw.editorState === 'object' && raw.editorState ? raw.editorState as Record<string, unknown> : undefined,
      imageUri: materialImage(raw),
      layers: Array.isArray(raw.layers) ? raw.layers.map(String) : [],
      note: typeof raw.note === 'string' ? raw.note : undefined,
      pages: Array.isArray(raw.pages) ? raw.pages as Array<{ index: number; url: string }> : undefined,
      title: typeof raw.title === 'string' ? raw.title : `Material ${material.id}`,
    },
    updatedAt: material.updatedAt,
    updatedBy: String(material.updatedBy ?? material.updatedByUser?.id ?? ''),
    updatedByName: displayName(material.updatedByUser),
  };
}

export function mapFile(file: ApiFile, versions: ApiMaterial[] = [], tasks: ResourceFileTask[] = []): ResourceFileNode {
  const mappedVersions = versions.map(mapMaterialVersion);

  return {
    content: file.description ?? `# ${file.title}`,
    createdAt: file.createdAt,
    createdBy: String(file.createdBy ?? file.createdByUser?.id ?? ''),
    createdByName: displayName(file.createdByUser),
    description: file.description ?? undefined,
    folderId: file.folderId === undefined ? (file.folder ? String(file.folder.id) : undefined) : String(file.folderId),
    id: String(file.id),
    language: 'Manga Page',
    materialVersions: mappedVersions,
    name: file.title,
    previewImageUri: mappedVersions[0]?.materials.imageUri,
    tasks,
    type: 'file',
    updatedAt: file.updatedAt,
  };
}

function mapTaskStatus(status: ApiTaskStatus): TaskStatus {
  if (status === 'DONE') return 'Done';
  if (status === 'INPROGRESS') return 'In Progress';
  if (status === 'REVIEW') return 'Review';
  return 'Pending';
}

export function mapTaskCard(task: ApiTask): Task {
  return {
    assignees: [task.assignedByUser?.avatarUrl ?? task.createdByUser?.avatarUrl ?? FALLBACK_AVATAR],
    dueLabel: task.deadline ? relativeDate(task.deadline) : 'No due date',
    id: String(task.id),
    priority: task.status === 'REVIEW' ? 'HIGH' : task.status === 'INPROGRESS' ? 'MEDIUM' : 'LOW',
    project: task.file?.folder?.title ?? 'Project',
    projectId: String(task.file?.folder?.id ?? ''),
    status: mapTaskStatus(task.status),
    title: task.title,
  };
}

export function mapFrame(frame: ApiFrame): ResourceTaskFrame {
  const startX = Number(frame.startX);
  const startY = Number(frame.startY);
  const endX = Number(frame.endX);
  const endY = Number(frame.endY);

  return {
    description: `Frame ${frame.id}`,
    endX,
    endY,
    height: endY - startY,
    id: String(frame.id),
    name: `Frame ${frame.id}`,
    startX,
    startY,
    width: endX - startX,
    x: startX,
    y: startY,
  };
}

export function mapComment(comment: ApiComment): ResourceTaskComment {
  const text =
    typeof comment.content === 'string'
      ? comment.content
      : comment.content?.text ?? '';
  const author = displayName(comment.createdByUser);

  return {
    author,
    authorRole: 'Reviewer',
    body: text,
    content: {
      attachments: [],
      mentions: typeof comment.content === 'object' ? comment.content?.mentions : [],
      text,
    },
    frameId: String(comment.frameId ?? ''),
    id: String(comment.id),
    initials: initials(author),
    time: relativeDate(comment.createdAt),
  };
}

export function mapResourceTask(task: ApiTask, frames: ApiFrame[] = [], comments: ApiComment[] = []): ResourceFileTask {
  return {
    assignedBy: String(task.assignedBy ?? task.assignedByUser?.id ?? ''),
    assignedByName: displayName(task.assignedByUser),
    comments: comments.map(mapComment),
    createdAt: task.createdAt,
    createdBy: String(task.createdBy ?? task.createdByUser?.id ?? ''),
    createdByName: displayName(task.createdByUser),
    deadline: task.deadline ?? undefined,
    description: task.description ?? undefined,
    fileId: String(task.fileId ?? task.file?.id ?? ''),
    frames: frames.map(mapFrame),
    id: String(task.id),
    status: task.status,
    title: task.title,
    updatedAt: task.updatedAt,
    updatedBy: String(task.updatedBy ?? task.updatedByUser?.id ?? ''),
    updatedByName: displayName(task.updatedByUser),
  };
}

function notificationFilter(type?: string): NotificationItem['filter'] {
  const normalized = (type ?? '').toLowerCase();
  if (normalized.includes('application')) return 'Applications';
  if (normalized.includes('project')) return 'Projects';
  if (normalized.includes('review')) return 'Reviews';
  return 'Tasks';
}

export function mapNotification(notification: ApiNotification): NotificationItem {
  const filter = notificationFilter(notification.type);

  return {
    filter,
    icon:
      filter === 'Applications'
        ? 'apps'
        : filter === 'Projects'
          ? 'folder'
          : filter === 'Reviews'
            ? 'assignment'
            : 'checklist',
    id: String(notification.id),
    isUnread: !notification.isRead,
    project: notification.project?.name ?? filter,
    subtitle: notification.message ?? '',
    time: relativeDate(notification.createdAt),
    title: notification.title ?? notification.message ?? 'Notification',
  };
}

export function groupNotifications(items: NotificationItem[]): NotificationSection[] {
  const today: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  items.forEach((item) => {
    if (item.time.includes('m ago') || item.time.includes('h ago') || item.time === 'Just now') {
      today.push(item);
    } else {
      earlier.push(item);
    }
  });

  return [
    { items: today, label: 'Today', sectionKey: 'today' },
    { items: earlier, label: 'Earlier', sectionKey: 'earlier' },
  ].filter((section) => section.items.length > 0);
}
