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
  sections: FilteredNotificationSection[];
}

export default function NotificationList({ sections }: NotificationListProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      renderSectionHeader={({ section }) => (
        <NotificationSectionHeader label={section.label} sectionKey={section.sectionKey} />
      )}
      renderItem={({ item }: { item: NotificationItem }) => (
        <NotificationRow
          item={item}
          onPress={() => {
            // TODO: navigate ke detail tương ứng
          }}
        />
      )}
    />
  );
}

