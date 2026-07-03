import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { NotifFilter } from '@/src/types/notifications';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { markNotificationAsRead, fetchNotifications } from '@/src/services/notificationApi';
import { RootStackNavProp } from '@/src/navigation/types';
import { ApiNotification } from '@/src/services/apiTypes';
import { groupNotifications, mapNotification, uniqueById } from '@/src/services/mappers';
import { subscribeToNotifications } from '@/src/services/realtimeClient';
import { NotificationItem } from '@/src/types/notifications';
import NotificationList from './components/NotificationList';
import NotificationsEmptyState from './components/NotificationsEmptyState';
import NotificationsTopBar from './components/NotificationsTopBar';

export default function NotificationsScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('All');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchNotifications();
      setItems((currentItems) => uniqueById([...currentItems, ...result.items]));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification: ApiNotification) => {
      const nextItem = mapNotification(notification);
      setItems((currentItems) => uniqueById([nextItem, ...currentItems]));
    });

    return unsubscribe;
  }, []);

  const sections = useMemo(() => groupNotifications(items), [items]);

  // Lọc theo filter chip đang active
  const filteredSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          data: section.items.filter((item) => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Unread') return item.isUnread;
            return item.filter === activeFilter;
          }),
        }))
        .filter((section) => section.data.length > 0),
    [activeFilter, sections],
  );

  const unreadCount = useMemo(() => items.filter((item) => item.isUnread).length, [items]);

  const markItemAsRead = useCallback((notificationId: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === notificationId ? { ...item, isUnread: false } : item,
      ),
    );
  }, []);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (item.isUnread) {
        markItemAsRead(item.id);
        void markNotificationAsRead(item.id).catch((error) => {
          console.warn('[NotificationsScreen] Mark notification as read failed.', error);
        });
      }

      if (!item.target) return;

      if (item.target.type === 'project' && item.target.projectId) {
        navigation.navigate('ProjectDetail', { projectId: item.target.projectId });
        return;
      }

      if (item.target.type === 'task' && item.target.taskId) {
        navigation.navigate('TaskDetail', { taskId: item.target.taskId });
        return;
      }

      if (item.target.type === 'application' && item.target.applicationId) {
        navigation.navigate('ApplicationDetail', {
          applicationId: item.target.applicationId,
          projectId: item.target.projectId ?? '',
        });
        return;
      }

      if (item.target.type === 'board' && item.target.boardId) {
        navigation.navigate('EditorBoardDetail', { boardId: item.target.boardId });
      }
    },
    [markItemAsRead, navigation],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <NotificationsTopBar
        activeFilter={activeFilter}
        unreadCount={unreadCount}
        onFilterChange={setActiveFilter}
      />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage ? (
        <ApiStateView type="error" message={errorMessage} onRetry={loadNotifications} />
      ) : filteredSections.length > 0 ? (
        <NotificationList sections={filteredSections} onNotificationPress={handleNotificationPress} />
      ) : (
        <NotificationsEmptyState />
      )}

      <BottomNavBar activeTab="inbox" />
    </View>
  );
}
