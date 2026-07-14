function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMetadataNumber(metadata: unknown, key: string): number | null {
  if (!isRecord(metadata)) return null;
  const value = metadata[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const MEMBER_ACTIONS = new Set(['MEMBER_INVITED', 'MEMBER_REMOVED', 'ROLE_CHANGED']);

export type ActivityRouteInput = {
  action: string;
  editorBoardId?: number | null;
  entityId: number;
  entityType: string;
  fileId?: number | null;
  metadata?: unknown;
  projectId?: number | null;
};

/**
 * Maps an ActivityLog entry to the frontend route a user should land on when
 * clicking it. Field availability (which of projectId/editorBoardId/fileId/
 * metadata.* are populated) mirrors exactly what each backend emit site sends
 * — see ACTIVITY_EVENT_NAME emissions in api/src/**\/*.service.ts.
 */
export function resolveActivityRoute(activity: ActivityRouteInput): string | null {
  const { action, editorBoardId, entityId, entityType, fileId, metadata, projectId } = activity;

  switch (entityType) {
    case 'PROJECT':
      if (!projectId) return null;
      return MEMBER_ACTIONS.has(action)
        ? `/studio/projects/${projectId}/members`
        : `/studio/projects/${projectId}`;

    case 'EDITOR_BOARD':
      if (!editorBoardId) return null;
      return MEMBER_ACTIONS.has(action)
        ? `/studio/editor-boards/${editorBoardId}/members`
        : `/studio/editor-boards/${editorBoardId}`;

    case 'APPLICATION':
      if (!projectId) return null;
      return `/studio/projects/${projectId}/applications?applicationId=${entityId}`;

    case 'TASK':
      if (!projectId) return null;
      if (action === 'TASK_DELETED') return `/studio/projects/${projectId}/tasks`;
      return `/studio/projects/${projectId}/tasks/${entityId}`;

    case 'FILE':
      if (!projectId) return null;
      if (action === 'FILE_DELETED') return `/studio/projects/${projectId}/files`;
      return `/studio/projects/${projectId}/files/${entityId}`;

    case 'MATERIAL':
      if (!projectId || !fileId) return null;
      return `/studio/projects/${projectId}/files/${fileId}`;

    case 'FOLDER':
      if (!projectId) return null;
      if (action === 'FOLDER_DELETED') return `/studio/projects/${projectId}/files`;
      return `/studio/projects/${projectId}/files?chapterId=${entityId}`;

    case 'COMMENT': {
      if (!projectId) return null;
      const taskId = getMetadataNumber(metadata, 'taskId');
      if (taskId) return `/studio/projects/${projectId}/tasks/${taskId}`;
      const applicationId = getMetadataNumber(metadata, 'applicationId');
      if (applicationId) return `/studio/projects/${projectId}/applications?applicationId=${applicationId}`;
      if (fileId) return `/studio/projects/${projectId}/files/${fileId}`;
      return null;
    }

    default:
      return null;
  }
}
