import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ProjectItem } from '@/src/types/projects';

interface BoardProjectRowProps {
  onPress: () => void;
  project: ProjectItem;
}

export default function BoardProjectRow({ onPress, project }: BoardProjectRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl p-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: project.avatarBg }}
      >
        <Text className="text-[12px] font-bold text-white">{project.avatarInitials}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
          {project.name}
        </Text>
        <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }}>
          {project.stats.completionRate}% complete · {project.stats.lastUpdated}
        </Text>
      </View>
      <MaterialIcon name="chevron_right" color={Colors.textFaint} size={22} />
    </TouchableOpacity>
  );
}

