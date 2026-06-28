import React from 'react';
import { View } from 'react-native';

import WorkItemRow from '@/src/components/sub-component/WorkItemRow';
import { Colors } from '@/src/constants/colors';
import { WORK_ITEMS } from '@/src/constants/homeData';

interface WorkItemsSectionProps {
  onApplicationsPress: () => void;
  onEditorBoardsPress: () => void;
  onTasksPress: () => void;
  onProjectsPress: () => void;
}

export default function WorkItemsSection({
  onApplicationsPress,
  onEditorBoardsPress,
  onTasksPress,
  onProjectsPress,
}: WorkItemsSectionProps) {
  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: Colors.surfaceContainer,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      {WORK_ITEMS.map((item, index) => (
        <WorkItemRow
          key={item.id}
          item={item}
          isLast={index === WORK_ITEMS.length - 1}
          onPress={
            item.id === 'tasks'
              ? onTasksPress
              : item.id === 'projects'
                ? onProjectsPress
                : item.id === 'applications'
                  ? onApplicationsPress
                  : item.id === 'editor-board'
                    ? onEditorBoardsPress
                    : undefined
          }
        />
      ))}
    </View>
  );
}
