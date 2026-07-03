'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getAccessToken } from '@/lib/auth-storage';
import { createRealtimeSocket } from '@/lib/realtime';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationResponse,
} from '@/services/notification.service';

export function useRealtimeNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextNotifications = await getNotifications();
      setNotifications(nextNotifications);
    } catch {
      setError('Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    const socket = createRealtimeSocket(accessToken);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setError('Realtime notifications are unavailable.'));
    socket.on('auth_error', () => setError('Realtime authentication failed.'));
    socket.on('notification:new', (notification: NotificationResponse) => {
      setNotifications((currentNotifications) => {
        const exists = currentNotifications.some((current) => current.id === notification.id);
        if (exists) {
          return currentNotifications.map((current) =>
            current.id === notification.id ? notification : current,
          );
        }

        return [notification, ...currentNotifications];
      });
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [enabled]);

  const markAsRead = useCallback(async (notificationId: number) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );

    try {
      const updatedNotification = await markNotificationAsRead(notificationId);
      if (updatedNotification) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, ...updatedNotification, isRead: true }
              : notification,
          ),
        );
      }
    } catch {
      setError('Unable to mark notification as read.');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true })),
    );

    try {
      await markAllNotificationsAsRead();
    } catch {
      setError('Unable to mark all notifications as read.');
    }
  }, []);

  return {
    error,
    isConnected,
    isLoading,
    markAllAsRead,
    markAsRead,
    notifications,
    refresh,
    unreadCount,
  };
}
