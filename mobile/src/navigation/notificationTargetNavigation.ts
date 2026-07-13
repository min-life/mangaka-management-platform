import { NotificationItem } from '@/src/types/notifications';
import { fetchTaskResourceTarget } from '@/src/services/taskApi';

import { RootStackNavProp } from './types';

function navigateToResourceFileTaskTarget(
  navigation: RootStackNavProp,
  target: NonNullable<NotificationItem['target']>,
) {
  void (async () => {
    if (!target.taskId) return;

    const resourceTarget =
      target.fileId && target.projectId
        ? { fileId: target.fileId, projectId: target.projectId }
        : await fetchTaskResourceTarget(target.taskId);

    navigation.navigate('ResourceFile', {
      fileId: resourceTarget.fileId,
      initialCommentId: target.commentId,
      initialDiscussionScope: target.initialDiscussionScope,
      initialFrameId: target.frameId,
      initialTab: target.initialTab ?? (target.commentId ? 'Discussion' : 'Tasks'),
      initialTaskId: target.taskId,
      parentFolderId: target.parentFolderId,
      projectId: resourceTarget.projectId,
    });
  })().catch((error) => {
    console.warn('[navigateToNotificationTarget] Open task target failed.', error);
  });
}

export function navigateToNotificationTarget(
  navigation: RootStackNavProp,
  target?: NotificationItem['target'],
) {
  if (!target) return;

  if (target.type === 'project' && target.projectId) {
    navigation.navigate('ProjectDetail', { projectId: target.projectId });
    return;
  }

  if (target.type === 'task' && target.taskId) {
    navigateToResourceFileTaskTarget(navigation, target);
    return;
  }

  if (target.type === 'application' && target.applicationId) {
    navigation.navigate('ApplicationDetail', {
      applicationId: target.applicationId,
      initialCommentId: target.commentId,
      initialTab:
        target.initialTab === 'Discussion' || target.initialTab === 'Materials'
          ? target.initialTab
          : undefined,
      ...(target.projectId ? { projectId: target.projectId } : {}),
    });
    return;
  }

  if (target.type === 'resourceFolder' && target.projectId && target.folderId) {
    navigation.navigate('ResourceFolderDetail', {
      folderId: target.folderId,
      projectId: target.projectId,
    });
    return;
  }

  if (target.type === 'resourceFile' && target.projectId && target.fileId) {
    navigation.navigate('ResourceFile', {
      fileId: target.fileId,
      initialCommentId: target.commentId,
      initialDiscussionScope: target.initialDiscussionScope,
      initialFrameId: target.frameId,
      initialTab: target.initialTab,
      initialTaskId: target.taskId,
      parentFolderId: target.parentFolderId,
      projectId: target.projectId,
    });
    return;
  }

  if (target.type === 'board' && target.boardId) {
    navigation.navigate('EditorBoardDetail', { boardId: target.boardId });
  }
}
