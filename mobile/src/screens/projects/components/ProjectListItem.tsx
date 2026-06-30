import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { ProjectItem } from '@/src/types/projects';

import { getProjectDateRange } from './projectFormatters';

interface ProjectListItemProps {
  project: ProjectItem;
  isLast: boolean;
  onPress?: () => void;
}

export default function ProjectListItem({ project, isLast, onPress }: ProjectListItemProps) {
  const dateRange = getProjectDateRange(project.createdAt, project.updatedAt);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="h-[96px] flex-row px-4 py-3"
      accessibilityRole="button"
      accessibilityLabel={`${project.name}, created by ${project.createdByName}, ${dateRange}`}
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.borderFaint,
      }}
    >
      <View
        className="h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-lg"
        style={{
          backgroundColor: project.avatarBg,
          borderWidth: 1,
          borderColor: Colors.borderFaint,
        }}
      >
        {project.coverUri ? (
          <Image
            source={{ uri: project.coverUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-xl font-black" style={{ color: Colors.text }}>
            {project.avatarInitials}
          </Text>
        )}
      </View>

      <View className="ml-4 flex-1 justify-center overflow-hidden">
        <Text className="text-[16px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
          {project.name}
        </Text>
        <Text
          className="mt-1 text-[13px] font-semibold"
          style={{ color: 'rgba(237,241,251,0.72)' }}
          numberOfLines={1}
        >
          {project.createdByName}
        </Text>
        <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {dateRange}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
