import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ProjectItem } from '@/src/types/projects';

interface ProjectListItemProps {
  project: ProjectItem;
  isLast: boolean;
  onPress?: () => void;
}

export default function ProjectListItem({ project, isLast, onPress }: ProjectListItemProps) {
  const starIconColor = project.stars > 0 ? Colors.accent : Colors.textFaint;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="px-4 py-5"
      accessibilityRole="button"
      accessibilityLabel={`${project.owner}, ${project.name}, ${project.stars} stars, ${project.language}`}
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.borderFaint,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: project.avatarBg }}
        >
          <Text className="text-[11px] font-bold" style={{ color: Colors.text }}>
            {project.avatarInitials}
          </Text>
        </View>
        <Text
          className="ml-3 flex-1 text-[15px]"
          style={{ color: 'rgba(237,241,251,0.72)' }}
          numberOfLines={1}
        >
          {project.owner}
        </Text>
      </View>

      <Text className="mt-3 text-xl font-bold" style={{ color: Colors.text }} numberOfLines={1}>
        {project.name}
      </Text>

      <View className="mt-4 flex-row items-center">
        <MaterialIcon name="star" color={starIconColor} size={18} />
        <Text className="ml-2 text-[12px]" style={{ color: Colors.textMuted }}>
          {project.stars}
        </Text>

        <View
          className="ml-5 h-4 w-4 rounded-full"
          style={{ backgroundColor: project.languageColor }}
        />
        <Text className="ml-2 text-[12px]" style={{ color: Colors.textMuted }}>
          {project.language}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
