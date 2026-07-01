import { Colors } from '@/src/constants/colors';
import { ApplicationItem, ApplicationStatus } from '@/src/types/applications';
import { EditorBoardItem, EditorBoardMember } from '@/src/types/editorBoards';
import {
  ProjectItem,
  ProjectMemberItem,
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
  ApiProjectMember,
  ApiTask,
  ApiTaskStatus,
  ApiUserSummary,
} from './apiTypes';
import { absoluteDate, displayName, initials, relativeDate } from './formatters';

const FALLBACK_AVATAR =
  'https://i.pravatar.cc/160?img=1';

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

type ApiCreatorEntity = {
  createByUser?: ApiUserSummary | null;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
};

function creatorUser(entity?: ApiCreatorEntity | null) {
  return entity?.createdByUser ?? entity?.createByUser ?? null;
}

function creatorId(entity?: ApiCreatorEntity | null) {
  return String(entity?.createdBy ?? creatorUser(entity)?.id ?? '');
}

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
  if (!project) {
    throw new Error('Project response is missing.');
  }

  const creator = displayName(creatorUser(project));
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
    createdBy: creatorId(project),
    createdByName: creator,
    currentUserRole: project.userProjects?.[0]?.role?.name ?? 'Member',
    description: project.description ?? undefined,
    editorBoard: extras.board?.name ?? project.editorBoard?.name ?? 'No editor board',
    editorBoardLeaderInitials: initials(creatorUser(extras.board)?.displayName),
    editorBoardLeaderName: displayName(creatorUser(extras.board)),
    editorBoardLeaderAvatarUri: creatorUser(extras.board)?.avatarUrl ?? undefined,
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

export function mapProjectMember(member: ApiProjectMember): ProjectMemberItem {
  const name = member.displayName || member.email || `User ${member.id}`;

  return {
    avatarUri: member.avatarUrl,
    email: member.email ?? '',
    id: String(member.id),
    initials: initials(name),
    joinedAtLabel: `Joined ${relativeDate(member.createdAt)}`,
    name,
    numberOfTasks: member.numberOfTasks ?? member.taskOverview?.total ?? 0,
    roleCode: member.role?.code ?? '',
    roleName: member.role?.name ?? 'Member',
    taskOverview: member.taskOverview ?? null,
  };
}

export function mapEditorBoard(board: ApiEditorBoard): EditorBoardItem {
  if (!board) {
    throw new Error('Editor board response is missing.');
  }

  return {
    createdBy: creatorId(board),
    currentUserRole: 'Member',
    description: board.description ?? 'Editor board workspace.',
    id: String(board.id),
    leadMemberId: creatorId(board),
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
  if (!application) {
    throw new Error('Application response is missing.');
  }

  const rawMaterials = Array.isArray(application.materials) ? application.materials : [];

  return {
    createdAtLabel: absoluteDate(application.createdAt),
    createdBy: displayName(creatorUser(application)),
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
    createdBy: creatorId(folder),
    createdByName: displayName(creatorUser(folder)),
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
  const imageUri = material?.imageUri ?? material?.thumbnailUrl ?? firstPage?.url;
  return typeof imageUri === 'string' && imageUri.trim() ? imageUri : undefined;
}

export function mapMaterialVersion(material: ApiMaterial): ResourceFileMaterialVersion {
  const raw = material.materials ?? {};

  return {
    createdAt: material.createdAt,
    createdBy: creatorId(material),
    createdByName: displayName(creatorUser(material)),
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

export function mapFile(
  file: ApiFile,
  versions: ApiMaterial[] = [],
  tasks: ResourceFileTask[] = [],
  comments: ApiComment[] = [],
): ResourceFileNode {
  const mappedVersions = uniqueById(versions.map(mapMaterialVersion));
  const mappedTasks = uniqueById(tasks);

  return {
    comments: uniqueById(comments.map(mapComment)),
    content: file.description ?? `# ${file.title}`,
    createdAt: file.createdAt,
    createdBy: creatorId(file),
    createdByName: displayName(creatorUser(file)),
    description: file.description ?? undefined,
    folderId: file.folderId === undefined ? (file.folder ? String(file.folder.id) : undefined) : String(file.folderId),
    id: String(file.id),
    language: 'Manga Page',
    materialVersions: mappedVersions,
    name: file.title,
    previewImageUri: mappedVersions[0]?.materials.imageUri,
    tasks: mappedTasks,
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
    assignees: [task.assignedByUser?.avatarUrl ?? creatorUser(task)?.avatarUrl ?? FALLBACK_AVATAR],
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
  const author = displayName(creatorUser(comment));

  return {
    applicationId: comment.applicationId === undefined || comment.applicationId === null ? undefined : String(comment.applicationId),
    author,
    authorRole: 'Reviewer',
    body: text,
    content: {
      attachments: [],
      mentions: typeof comment.content === 'object' ? comment.content?.mentions : [],
      text,
    },
    fileId: comment.fileId === undefined || comment.fileId === null ? undefined : String(comment.fileId),
    frameId: String(comment.frameId ?? ''),
    id: String(comment.id),
    initials: initials(author),
    taskId: comment.taskId === undefined || comment.taskId === null ? undefined : String(comment.taskId),
    time: relativeDate(comment.createdAt),
  };
}

export function mapResourceTask(task: ApiTask, frames: ApiFrame[] = [], comments: ApiComment[] = []): ResourceFileTask {
  return {
    assignedBy: String(task.assignedBy ?? task.assignedByUser?.id ?? ''),
    assignedByName: displayName(task.assignedByUser),
    comments: uniqueById(comments.map(mapComment)),
    createdAt: task.createdAt,
    createdBy: creatorId(task),
    createdByName: displayName(creatorUser(task)),
    deadline: task.deadline ?? undefined,
    description: task.description ?? undefined,
    fileId: String(task.fileId ?? task.file?.id ?? ''),
    frames: uniqueById(frames.map(mapFrame)),
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

function notificationFilterFromEntity(entityType?: string): NotificationItem['filter'] {
  const normalized = (entityType ?? '').toLowerCase();
  if (normalized.includes('application')) return 'Applications';
  if (normalized.includes('project')) return 'Projects';
  if (normalized.includes('editor_board')) return 'Projects';
  if (normalized.includes('comment')) return 'Reviews';
  return 'Tasks';
}

function humanizeAction(action?: string) {
  return (action ?? 'Notification')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function mapNotification(notification: ApiNotification): NotificationItem {
  const activityLog = notification.activityLog;
  const filter = notification.type
    ? notificationFilter(notification.type)
    : notificationFilterFromEntity(activityLog?.entityType);
  const entityType = activityLog?.entityType?.toUpperCase();
  const entityId = activityLog?.entityId === undefined ? undefined : String(activityLog.entityId);
  const projectId = activityLog?.projectId === undefined || activityLog.projectId === null
    ? undefined
    : String(activityLog.projectId);
  const boardId =
    activityLog?.editorBoardId === undefined || activityLog.editorBoardId === null
      ? undefined
      : String(activityLog.editorBoardId);
  const target: NotificationItem['target'] | undefined =
    entityType === 'PROJECT' && entityId
      ? { projectId: entityId, type: 'project' }
      : entityType === 'TASK' && entityId
        ? { taskId: entityId, type: 'task' }
        : entityType === 'APPLICATION' && entityId
          ? { applicationId: entityId, projectId: projectId ?? '', type: 'application' }
          : entityType === 'EDITOR_BOARD' && entityId
            ? { boardId: entityId, type: 'board' }
            : projectId
              ? { projectId, type: 'project' }
              : boardId
                ? { boardId, type: 'board' }
                : undefined;

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
    subtitle:
      notification.message ??
      (activityLog?.actor
        ? `${displayName(activityLog.actor)} triggered ${humanizeAction(activityLog.action).toLowerCase()}.`
        : ''),
    target,
    time: relativeDate(notification.createdAt),
    title: notification.title ?? humanizeAction(activityLog?.action),
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
