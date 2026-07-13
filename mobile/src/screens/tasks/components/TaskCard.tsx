import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

import AvatarStack from './AvatarStack';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { Task } from './types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      className="rounded-2xl p-5 mb-4"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="font-semibold text-[15px] flex-shrink" style={{ color: Colors.text }}>
              {task.title}
            </Text>
          </View>
          <Text className="text-[12px]" style={{ color: 'rgba(237,241,251,0.75)' }}>
            {task.project}
          </Text>
        </View>
        <StatusBadge status={task.status} />
      </View>

      <View className="flex-row justify-between items-center mt-4">
        <AvatarStack uris={task.assignees} />
        <View className="flex-row items-center gap-1">
          <MaterialIcon name="calendar_today" color="rgba(237,241,251,0.65)" size={16} />
          <Text className="text-[12px]" style={{ color: 'rgba(237,241,251,0.65)' }}>
            {task.dueLabel}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
