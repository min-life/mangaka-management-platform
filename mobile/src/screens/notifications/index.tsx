import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { NotifFilter } from '@/src/types/notifications';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { fetchNotifications } from '@/src/services/notificationApi';
import { NotificationSection } from '@/src/types/notifications';
import NotificationList from './components/NotificationList';
import NotificationsEmptyState from './components/NotificationsEmptyState';
import NotificationsTopBar from './components/NotificationsTopBar';

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('All');
  const [sections, setSections] = useState<NotificationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchNotifications();
      setSections(result.sections);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Lọc theo filter chip đang active
  const filteredSections = sections
    .map((section) => ({
      ...section,
      data: section.items.filter((item) => {
        if (activeFilter === 'All')    return true;
        if (activeFilter === 'Unread') return item.isUnread;
        return item.filter === activeFilter;
      }),
    }))
    .filter((section) => section.data.length > 0);

  const unreadCount = sections
    .flatMap((s) => s.items)
    .filter((i) => i.isUnread).length;

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
        <NotificationList sections={filteredSections} />
      ) : (
        <NotificationsEmptyState />
      )}

      <BottomNavBar activeTab="inbox" />
    </View>
  );
}
