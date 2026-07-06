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
import type { ProjectResourceStats } from './resourceApi';

import {
  ApiApplication,
  ApiActivityLog,
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
    applicationTotal?: number;
    board?: ApiEditorBoard | null;
    folders?: ApiFolder[];
    folderTotal?: number;
    memberTotal?: number;
    resourceStats?: ProjectResourceStats | null;
    stats?: Record<string, unknown> | null;
    tasks?: ApiTask[];
    taskTotal?: number;
  } = {},
): ProjectItem {
  if (!project) {
    throw new Error('Project response is missing.');
  }

  const creator = displayName(creatorUser(project));
  const completionRate =
    Number(
      extras.stats?.progress ?? extras.stats?.completionRate ?? extras.stats?.completedTasks,
    ) || 0;
  const tasks = taskSummary(extras.tasks);
  const applicationTotal =
    extras.applicationTotal ?? extras.applications?.length ?? project._count?.applications ?? 0;
  const folderTotal =
    extras.resourceStats?.folders ??
    extras.folderTotal ??
    project._count?.folders ??
    extras.folders?.length ??
    0;
  const memberTotal =
    extras.memberTotal ?? project.userProjects?.length ?? project._count?.userProjects ?? 0;
  const taskTotal = extras.taskTotal ?? extras.tasks?.length ?? project._count?.tasks ?? 0;

  return {
    activeMembers: memberTotal,
    applications: {
      approved: extras.applications?.filter((item) => item.status === 'APPROVE').length ?? 0,
      cancelled: extras.applications?.filter((item) => item.status === 'CANCELLED').length ?? 0,
      pending:
        extras.applications?.filter((item) =>
          ['INTERNAL_APPROVED', 'PENDING', 'SUBMITTED'].includes(item.status),
        ).length ??
        project._count?.applications ??
        0,
      rejected: extras.applications?.filter((item) => item.status === 'REJECT').length ?? 0,
    },
    applicationTotal,
    avatarBg: Colors.surfaceContainer,
    avatarInitials: initials(project.name),
    branch: 'main',
    contributors: memberTotal,
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
    files: extras.resourceStats?.files ?? project._count?.files ?? 0,
    folders: folderTotal,
    forks: 0,
    id: String(project.id),
    language: projectTypeFromName(project.name),
    languageColor: Colors.accent,
    materials: extras.resourceStats?.materials ?? project._count?.materials ?? 0,
    name: project.name,
    owner: creator,
    rootFolders:
      extras.resourceStats?.rootFolders ??
      extras.folders?.filter((folder) => !folder.parent && !folder.parentId).length ??
      0,
    stars: memberTotal,
    stats: {
      completionRate: Math.min(100, Math.max(0, completionRate)),
      frameComments: Number(extras.stats?.frameComments ?? 0),
      lastUpdated: `Updated ${relativeDate(project.updatedAt)}`,
      pagesReviewed: Number(extras.stats?.pagesReviewed ?? extras.stats?.completedTasks ?? 0),
    },
    tasks,
    taskTotal,
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
    projectIds: Array.from(
      { length: board._count?.projects ?? 0 },
      (_, index) => `project-${index}`,
    ),
    updatedAtLabel: `Updated ${relativeDate(board.updatedAt)}`,
  };
}

export function mapBoardMember(item: {
  user?: ApiUserSummary;
  isLead?: boolean;
}): EditorBoardMember {
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

export function mapFolder(
  folder: ApiFolder,
  children: Array<ResourceFolderNode | ResourceFileNode> = [],
): ResourceFolderNode {
  return {
    children,
    coverUri: folder.imageUrl ?? undefined,
    createdAt: folder.createdAt,
    createdBy: creatorId(folder),
    createdByName: displayName(creatorUser(folder)),
    description: folder.description ?? undefined,
    id: String(folder.id),
    name: folder.title,
    parentId:
      folder.parentId === undefined
        ? folder.parent
          ? String(folder.parent.id)
          : null
        : folder.parentId === null
          ? null
          : String(folder.parentId),
    projectId:
      folder.projectId === undefined
        ? folder.project
          ? String(folder.project.id)
          : undefined
        : String(folder.projectId),
    type: 'folder',
    updatedAt: folder.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function materialImage(material?: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (Array.isArray(material)) {
    const thumbnail =
      material.find((item) => item.isThumbnail === true && stringValue(item.url)) ??
      material.find((item) => item.type === 'IMAGE' && stringValue(item.url)) ??
      material.find((item) => stringValue(item.url));

    return stringValue(thumbnail?.url);
  }

  if (!isRecord(material)) return undefined;

  const pages = Array.isArray(material.pages) ? material.pages : [];
  const firstPage = pages[0] as { url?: unknown } | undefined;
  const imageUri = material.imageUri ?? material.thumbnailUrl ?? firstPage?.url;
  return stringValue(imageUri);
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
      editorState:
        isRecord(raw) && typeof raw.editorState === 'object' && raw.editorState
          ? (raw.editorState as Record<string, unknown>)
          : undefined,
      imageUri: materialImage(raw),
      layers: isRecord(raw) && Array.isArray(raw.layers) ? raw.layers.map(String) : [],
      note: isRecord(raw) && typeof raw.note === 'string' ? raw.note : undefined,
      pages:
        isRecord(raw) && Array.isArray(raw.pages)
          ? (raw.pages as Array<{ index: number; url: string }>)
          : undefined,
      title:
        material.name ??
        (isRecord(raw) && typeof raw.title === 'string' ? raw.title : `Material ${material.id}`),
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
    folderId:
      file.folderId === undefined
        ? file.folder
          ? String(file.folder.id)
          : undefined
        : String(file.folderId),
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
  const assignees = [task.assignedByUser?.avatarUrl, creatorUser(task)?.avatarUrl].filter(
    (uri): uri is string => Boolean(uri?.trim()),
  );

  return {
    assignees,
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
    description: frame.name ?? `Frame ${frame.id}`,
    endX,
    endY,
    height: endY - startY,
    id: String(frame.id),
    materialId:
      frame.materialId === undefined || frame.materialId === null
        ? frame.material?.id === undefined
          ? undefined
          : String(frame.material.id)
        : String(frame.materialId),
    name: frame.name ?? `Frame ${frame.id}`,
    startX,
    startY,
    width: endX - startX,
    x: startX,
    y: startY,
  };
}

export function mapComment(comment: ApiComment): ResourceTaskComment {
  const text =
    typeof comment.content === 'string' ? comment.content : (comment.content?.text ?? '');
  const author = displayName(creatorUser(comment));
  const frameId = comment.frameId ?? comment.frame?.id;
  const material = comment.material ?? comment.frame?.material ?? null;

  return {
    applicationId:
      comment.applicationId === undefined || comment.applicationId === null
        ? undefined
        : String(comment.applicationId),
    author,
    authorRole: '',
    body: text,
    content: {
      attachments: [],
      mentions: typeof comment.content === 'object' ? comment.content?.mentions : [],
      text,
    },
    fileId:
      comment.fileId === undefined || comment.fileId === null ? undefined : String(comment.fileId),
    frameId: frameId === undefined || frameId === null ? '' : String(frameId),
    frameName: comment.frame?.name ?? undefined,
    id: String(comment.id),
    initials: initials(author),
    materialFileId:
      material?.fileId === undefined
        ? material?.file?.id === undefined
          ? undefined
          : String(material.file.id)
        : String(material.fileId),
    materialId:
      material?.id === undefined || material.id === null ? undefined : String(material.id),
    materialName: material?.name ?? undefined,
    taskId:
      comment.taskId === undefined || comment.taskId === null ? undefined : String(comment.taskId),
    time: relativeDate(comment.createdAt),
  };
}

export function mapResourceTask(
  task: ApiTask,
  frames: ApiFrame[] = [],
  comments: ApiComment[] = [],
): ResourceFileTask {
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

function stringId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
}

function metadataStringId(metadata: Record<string, unknown> | null | undefined, key: string) {
  return stringId(metadata?.[key]);
}

export function mapActivityLogTarget(
  activityLog?: ApiActivityLog | ApiNotification['activityLog'] | null,
): NotificationItem['target'] | undefined {
  const entityType = activityLog?.entityType?.toUpperCase();
  const entityId = stringId(activityLog?.entityId);
  const projectId = stringId(activityLog?.projectId);
  const boardId = stringId(activityLog?.editorBoardId);
  const fileId = stringId(activityLog?.fileId);
  const metadata =
    activityLog?.metadata && typeof activityLog.metadata === 'object' ? activityLog.metadata : null;
  const metadataApplicationId = metadataStringId(metadata, 'applicationId');
  const metadataFrameId = metadataStringId(metadata, 'frameId');
  const metadataTaskId = metadataStringId(metadata, 'taskId');

  if (entityType === 'PROJECT' && entityId) return { projectId: entityId, type: 'project' };
  if (entityType === 'EDITOR_BOARD' && entityId) return { boardId: entityId, type: 'board' };
  if (entityType === 'TASK' && entityId) return { taskId: entityId, type: 'task' };
  if (entityType === 'APPLICATION' && entityId) {
    return { applicationId: entityId, projectId, type: 'application' };
  }
  if (entityType === 'FOLDER' && entityId && projectId) {
    return { folderId: entityId, projectId, type: 'resourceFolder' };
  }
  if (entityType === 'FILE' && entityId && projectId) {
    return { fileId: entityId, initialTab: 'Overview', projectId, type: 'resourceFile' };
  }
  if (entityType === 'MATERIAL' && fileId && projectId) {
    return { fileId, initialTab: 'Materials', projectId, type: 'resourceFile' };
  }
  if (entityType === 'FRAME' && fileId && projectId) {
    return { fileId, initialTab: 'Discussion', projectId, type: 'resourceFile' };
  }
  if (entityType === 'COMMENT') {
    const commentId = entityId;

    if (metadataApplicationId) {
      return {
        applicationId: metadataApplicationId,
        commentId,
        initialTab: 'Discussion',
        projectId,
        type: 'application',
      };
    }
    if (metadataFrameId && fileId && projectId) {
      return {
        commentId,
        fileId,
        frameId: metadataFrameId,
        initialDiscussionScope: 'frame',
        initialTab: 'Discussion',
        projectId,
        type: 'resourceFile',
      };
    }
    if (metadataTaskId && fileId && projectId) {
      return {
        commentId,
        fileId,
        initialDiscussionScope: 'task',
        initialTab: 'Discussion',
        projectId,
        taskId: metadataTaskId,
        type: 'resourceFile',
      };
    }
    if (fileId && projectId) {
      return {
        commentId,
        fileId,
        initialDiscussionScope: 'file',
        initialTab: 'Discussion',
        projectId,
        type: 'resourceFile',
      };
    }
    if (metadataTaskId) {
      return {
        commentId,
        initialDiscussionScope: 'task',
        initialTab: 'Discussion',
        taskId: metadataTaskId,
        type: 'task',
      };
    }
    if (projectId) return { projectId, type: 'project' };
  }
  if (projectId) return { projectId, type: 'project' };
  if (boardId) return { boardId, type: 'board' };
  return undefined;
}

export function mapNotification(notification: ApiNotification): NotificationItem {
  const activityLog = notification.activityLog;
  const filter = notification.type
    ? notificationFilter(notification.type)
    : notificationFilterFromEntity(activityLog?.entityType);
  const target = mapActivityLogTarget(activityLog);

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
