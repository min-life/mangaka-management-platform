import React from 'react';
import { View } from 'react-native';

import WorkItemRow from '@/src/components/sub-component/WorkItemRow';
import { Colors } from '@/src/constants/colors';
import { WORK_ITEMS } from '@/src/constants/homeData';
import { WorkItem } from '@/src/types/home';

interface WorkItemsSectionProps {
  onApplicationsPress: () => void;
  onEditorBoardsPress: () => void;
  onTasksPress: () => void;
  onProjectsPress: () => void;
  workItems?: WorkItem[];
}

export default function WorkItemsSection({
  onApplicationsPress,
  onEditorBoardsPress,
  onTasksPress,
  onProjectsPress,
  workItems = WORK_ITEMS,
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
      {workItems.map((item, index) => (
        <WorkItemRow
          key={item.id}
          item={item}
          isLast={index === workItems.length - 1}
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
