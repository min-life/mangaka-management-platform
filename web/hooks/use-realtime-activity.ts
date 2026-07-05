'use client';

import { useEffect, useState } from 'react';

import { getAccessToken } from '@/lib/auth-storage';
import { createRealtimeSocket } from '@/lib/realtime';
import type { ActivityLogResponse } from '@/services/activity-log.service';

export function useRealtimeProjectActivity(projectId?: number | string) {
  const [activities, setActivities] = useState<ActivityLogResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const numericProjectId = Number(projectId);
    const accessToken = getAccessToken();

    if (!Number.isFinite(numericProjectId) || !accessToken) {
      return;
    }

    const socket = createRealtimeSocket(accessToken);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('project:subscribe', { projectId: numericProjectId });
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('activity:new', (activity: ActivityLogResponse) => {
      setActivities((currentActivities) => [activity, ...currentActivities]);
    });

    socket.connect();

    return () => {
      socket.emit('project:unsubscribe', { projectId: numericProjectId });
      socket.disconnect();
    };
  }, [projectId]);

  return {
    activities,
    isConnected,
  };
}

export function useRealtimeComments(
  entityType?: 'FILE' | 'TASK' | string,
  entityId?: number | string,
) {
  const [createdComments, setCreatedComments] = useState<unknown[]>([]);
  const [updatedComments, setUpdatedComments] = useState<unknown[]>([]);
  const [deletedCommentIds, setDeletedCommentIds] = useState<number[]>([]);

  useEffect(() => {
    if (!entityType || !entityId) {
      return;
    }

    const numericEntityId = Number(entityId);
    const accessToken = getAccessToken();

    if (!Number.isFinite(numericEntityId) || !accessToken) {
      return;
    }

    const socket = createRealtimeSocket(accessToken);
    const subscription = { entityId: numericEntityId, entityType };

    socket.on('connect', () => {
      socket.emit('comment:subscribe', subscription);
    });
    socket.on('comment:new', (comment: unknown) => {
      setCreatedComments((currentComments) => [...currentComments, comment]);
    });
    socket.on('comment:updated', (comment: unknown) => {
      setUpdatedComments((currentComments) => [...currentComments, comment]);
    });
    socket.on('comment:deleted', ({ commentId }: { commentId: number }) => {
      setDeletedCommentIds((currentIds) => [...currentIds, commentId]);
    });

    socket.connect();

    return () => {
      socket.emit('comment:unsubscribe', subscription);
      socket.disconnect();
    };
  }, [entityId, entityType]);

  return {
    createdComments,
    deletedCommentIds,
    updatedComments,
  };
}
