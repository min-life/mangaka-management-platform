import React from 'react';
import { SectionList } from 'react-native';

import NotificationRow from '@/src/components/sub-component/NotificationRow';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import { NotificationItem } from '@/src/types/notifications';

import NotificationSectionHeader from './NotificationSectionHeader';

interface FilteredNotificationSection {
  sectionKey: string;
  label: string;
  data: NotificationItem[];
}

interface NotificationListProps {
  onNotificationPress: (item: NotificationItem) => void;
  onRefresh: () => void;
  refreshing: boolean;
  sections: FilteredNotificationSection[];
}

export default function NotificationList({
  onNotificationPress,
  onRefresh,
  refreshing,
  sections,
}: NotificationListProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 112 }}
      style={{ flex: 1 }}
      // refreshControl={
      //   <AppRefreshControl onRefresh={onRefresh} refreshing={refreshing} />
      // }
      renderSectionHeader={({ section }) => (
        <NotificationSectionHeader label={section.label} sectionKey={section.sectionKey} />
      )}
      renderItem={({ item }: { item: NotificationItem }) => (
        <NotificationRow
          item={item}
          onPress={() => onNotificationPress(item)}
        />
      )}
    />
  );
}

