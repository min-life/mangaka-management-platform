import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import { NotifFilter } from '@/src/types/notifications';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  fetchNotifications,
} from '@/src/services/notificationApi';
import { RootStackNavProp } from '@/src/navigation/types';
import { navigateToNotificationTarget } from '@/src/navigation/notificationTargetNavigation';
import { ApiNotification } from '@/src/services/apiTypes';
import { groupNotifications, mapNotification, uniqueById } from '@/src/services/mappers';
import { subscribeToNotifications } from '@/src/services/realtimeClient';
import { NotificationItem } from '@/src/types/notifications';
import NotificationList from './components/NotificationList';
import NotificationsFilterBar from './components/NotificationsFilterBar';
import NotificationsEmptyState from './components/NotificationsEmptyState';
import NotificationsTopBar from './components/NotificationsTopBar';

export default function NotificationsScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('All');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = useCallback(async (options: { showLoading?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage('');

    try {
      const result = await fetchNotifications();
      setItems(uniqueById(result.items));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải notifications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = useCallback(() => {
    void loadNotifications({ showLoading: false });
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

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0) return;

    setItems((currentItems) => currentItems.map((item) => ({ ...item, isUnread: false })));

    void markAllNotificationsAsRead().catch((error) => {
      console.warn('[NotificationsScreen] Mark all notifications as read failed.', error);
      void loadNotifications({ showLoading: false });
    });
  }, [loadNotifications, unreadCount]);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (item.isUnread) {
        markItemAsRead(item.id);
        void markNotificationAsRead(item.id).catch((error) => {
          console.warn('[NotificationsScreen] Mark notification as read failed.', error);
        });
      }

      navigateToNotificationTarget(navigation, item.target);
    },
    [markItemAsRead, navigation],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <NotificationsTopBar unreadCount={unreadCount} onMarkAllRead={handleMarkAllRead} />

      <NotificationsFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage ? (
        <ApiStateView type="error" message={errorMessage} onRetry={loadNotifications} />
      ) : filteredSections.length > 0 ? (
        <NotificationList
          onNotificationPress={handleNotificationPress}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          sections={filteredSections}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 112 }}
          // refreshControl={
          //   <AppRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />
          // }
          showsVerticalScrollIndicator={false}
        >
          <NotificationsEmptyState />
        </ScrollView>
      )}

      <BottomNavBar activeTab="inbox" unreadInboxCount={unreadCount} />
    </View>
  );
}
