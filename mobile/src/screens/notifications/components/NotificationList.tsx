import React from 'react';
import { SectionList } from 'react-native';

import NotificationRow from '@/src/components/sub-component/NotificationRow';
import { NotificationItem } from '@/src/types/notifications';

import NotificationSectionHeader from './NotificationSectionHeader';

interface FilteredNotificationSection {
  sectionKey: string;
  label: string;
  data: NotificationItem[];
}

interface NotificationListProps {
  onNotificationPress: (item: NotificationItem) => void;
  sections: FilteredNotificationSection[];
}

export default function NotificationList({ onNotificationPress, sections }: NotificationListProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
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

