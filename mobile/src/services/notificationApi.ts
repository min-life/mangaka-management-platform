import { ApiNotification } from './apiTypes';
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

