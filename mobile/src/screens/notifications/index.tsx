import React, { useState } from 'react';
import { View } from 'react-native';

import { NotifFilter } from '@/src/types/notifications';
import { NOTIFICATION_SECTIONS } from '@/src/constants/notificationsData';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import NotificationList from './components/NotificationList';
import NotificationsEmptyState from './components/NotificationsEmptyState';
import NotificationsTopBar from './components/NotificationsTopBar';

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('All');

  // Lọc theo filter chip đang active
  const filteredSections = NOTIFICATION_SECTIONS
    .map((section) => ({
      ...section,
      data: section.items.filter((item) => {
        if (activeFilter === 'All')    return true;
        if (activeFilter === 'Unread') return item.isUnread;
        return item.filter === activeFilter;
      }),
    }))
    .filter((section) => section.data.length > 0);

  const unreadCount = NOTIFICATION_SECTIONS
    .flatMap((s) => s.items)
    .filter((i) => i.isUnread).length;

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <NotificationsTopBar
        activeFilter={activeFilter}
        unreadCount={unreadCount}
        onFilterChange={setActiveFilter}
      />

      {filteredSections.length > 0 ? (
        <NotificationList sections={filteredSections} />
      ) : (
        <NotificationsEmptyState />
      )}

      <BottomNavBar activeTab="inbox" />
    </View>
  );
}
