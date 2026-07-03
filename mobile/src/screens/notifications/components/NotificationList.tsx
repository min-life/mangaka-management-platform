import React from 'react';
import { SectionList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import NotificationRow from '@/src/components/sub-component/NotificationRow';
import { RootStackNavProp } from '@/src/navigation/types';
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
  const navigation = useNavigation<RootStackNavProp>();

  const handlePress = (item: NotificationItem) => {
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
  };

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
          onPress={() => handlePress(item)}
        />
      )}
    />
  );
}

