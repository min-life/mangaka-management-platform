import api from '@/lib/api';
import type { ActivityLogResponse } from './activity-log.service';

export type NotificationResponse = {
  activityLog?: ActivityLogResponse | null;
  activityLogId: number;
  createdAt: string;
  id: number;
  isRead: boolean;
  userId: number;
};

type NotificationsResponse = {
  data?: NotificationResponse[];
};

type NotificationApiResponse = {
  data?: NotificationResponse;
};

export async function getNotifications() {
  const response = await api.get<NotificationsResponse, NotificationsResponse>('/notifications');

  return response.data ?? [];
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await api.patch<NotificationApiResponse, NotificationApiResponse>(
    `/notifications/${notificationId}/read`,
  );

  return response.data ?? null;
}

export async function markAllNotificationsAsRead() {
  await api.patch('/notifications/read-all');
}
