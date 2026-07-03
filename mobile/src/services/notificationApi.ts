import { ApiDataResponse, ApiNotification } from './apiTypes';
import { apiRequest } from './apiClient';
import { groupNotifications, mapNotification, uniqueById } from './mappers';

export async function fetchNotifications() {
  const response = await apiRequest<ApiNotification[] | { data?: ApiNotification[] }>('/notifications');
  const data = Array.isArray(response) ? response : response.data ?? [];
  const items = uniqueById(data.map(mapNotification));
  return {
    items,
    sections: groupNotifications(items),
  };
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await apiRequest<ApiDataResponse<ApiNotification>>(
    `/notifications/${notificationId}/read`,
    { method: 'PATCH' },
  );

  return response.data ? mapNotification(response.data) : null;
}

export async function markAllNotificationsAsRead() {
  await apiRequest<{ success?: boolean }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

