export type ActorLike = { displayName?: string | null; email?: string | null } | null | undefined;

type ActivityLike = {
  action: string;
  entityType: string;
  actor?: ActorLike;
  actorId: number;
  metadata?: unknown;
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  PROJECT: 'project',
  EDITOR_BOARD: 'editor board',
  FOLDER: 'folder',
  FILE: 'file',
  MATERIAL: 'material',
  TASK: 'task',
  FRAME: 'frame',
  COMMENT: 'comment',
  APPLICATION: 'application',
};

export function getActorLabel(actor: ActorLike, actorId?: number | null): string {
  return actor?.displayName || actor?.email || `User #${actorId ?? ''}`;
}

export function getEntityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType.toLowerCase().replaceAll('_', ' ');
}

export function formatActionTitle(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getCommentContextLabel(metadata: unknown): 'task' | 'application' | 'frame' | 'file' {
  if (isRecord(metadata)) {
    if (metadata.taskId !== undefined) return 'task';
    if (metadata.applicationId !== undefined) return 'application';
    if (metadata.frameId !== undefined) return 'frame';
  }

  return 'file';
}

// Verb phrase only (no actor prefix), for callers that render the actor
// name separately (e.g. bolded) from the rest of the sentence.
export function getActivityVerbPhrase(activity: ActivityLike): string {
  const entityLabel = getEntityTypeLabel(activity.entityType);

  switch (activity.action) {
    case 'MEMBER_INVITED':
      return `invited a new member to the ${entityLabel}.`;
    case 'MEMBER_REMOVED':
      return `removed a member from the ${entityLabel}.`;
    case 'ROLE_CHANGED':
      return `changed a member's role.`;
    case 'TASK_CREATED':
      return `created a new task.`;
    case 'TASK_ASSIGNED':
      return `assigned a task.`;
    case 'TASK_UPDATED':
      return `updated a task.`;
    case 'TASK_COMPLETED':
      return `completed a task.`;
    case 'TASK_DELETED':
      return `deleted a task.`;
    case 'FOLDER_CREATED':
      return `created a folder.`;
    case 'FOLDER_MOVED':
      return `moved a folder.`;
    case 'FOLDER_DELETED':
      return `deleted a folder.`;
    case 'FILE_CREATED':
      return `created a file.`;
    case 'FILE_DELETED':
      return `deleted a file.`;
    case 'MATERIAL_UPLOADED':
      return `uploaded a new material.`;
    case 'MATERIAL_RESTORED':
      return `restored a material.`;
    case 'APPLICATION_CREATED':
      return `created a new application.`;
    case 'APPLICATION_INTERNAL_APPROVED':
      return `internally approved an application.`;
    case 'APPLICATION_SUBMITTED':
      return `submitted an application.`;
    case 'APPLICATION_APPROVED':
      return `approved an application.`;
    case 'APPLICATION_REJECTED':
      return `rejected an application.`;
    case 'COMMENT_CREATED':
      return `commented on a ${getCommentContextLabel(activity.metadata)}.`;
    case 'COMMENT_DELETED':
      return `deleted a comment.`;
    default:
      return `performed an action on a ${entityLabel}.`;
  }
}

export function formatActivityLogText(activity: ActivityLike): string {
  const actor = getActorLabel(activity.actor, activity.actorId);
  return `${actor} ${getActivityVerbPhrase(activity)}`;
}

export function formatNotificationText(notification: {
  activityLog?: ActivityLike | null;
  id: number;
}): { title: string; description: string } {
  const activity = notification.activityLog;

  if (!activity) {
    return {
      description: `Notification #${notification.id}`,
      title: 'New notification',
    };
  }

  const actor = getActorLabel(activity.actor, activity.actorId);
  const title = formatActionTitle(activity.action);
  const isProject = activity.entityType === 'PROJECT';
  const entityLabel = isProject ? 'project' : 'editor board';

  switch (activity.action) {
    case 'MEMBER_INVITED':
      return { description: `${actor} added you to their ${entityLabel}.`, title };
    case 'MEMBER_REMOVED':
      return { description: `${actor} removed you from their ${entityLabel}.`, title };
    case 'ROLE_CHANGED':
      return { description: `${actor} changed your role.`, title };
    case 'TASK_ASSIGNED':
      return { description: `${actor} assigned a task to you.`, title };
    case 'TASK_UPDATED':
      return { description: `${actor} updated a task.`, title };
    case 'TASK_COMPLETED':
      return { description: `${actor} completed a task.`, title };
    case 'TASK_DELETED':
      return { description: `${actor} deleted a task.`, title };
    case 'APPLICATION_CREATED':
    case 'APPLICATION_SUBMITTED':
      return { description: `${actor} submitted an application.`, title };
    case 'APPLICATION_APPROVED':
      return { description: `${actor} approved your application.`, title };
    case 'APPLICATION_REJECTED':
      return { description: `${actor} rejected your application.`, title };
    case 'APPLICATION_INTERNAL_APPROVED':
      return { description: `${actor} internally approved your application.`, title };
    case 'COMMENT_CREATED': {
      const context = getCommentContextLabel(activity.metadata);

      if (context === 'task') {
        return { description: `${actor} commented on your task.`, title };
      }

      if (context === 'application') {
        return { description: `${actor} commented on your application.`, title };
      }

      return { description: `${actor} commented on a ${context} you're following.`, title };
    }
    default:
      return { description: `${actor} performed ${title.toLowerCase()}.`, title };
  }
}
