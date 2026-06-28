import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { ProjectItem } from '@/src/types/projects';

import { getProjectDateRange } from './projectFormatters';

interface ProjectCardItemProps {
  project: ProjectItem;
  onPress?: () => void;
}

export default function ProjectCardItem({ project, onPress }: ProjectCardItemProps) {
  const dateRange = getProjectDateRange(project.createdAt, project.updatedAt);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${project.name}, created by ${project.createdByName}, ${dateRange}`}
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <View
        className="h-[150px] w-full items-center justify-center"
        style={{ backgroundColor: project.avatarBg }}
      >
        {project.coverUri ? (
          <Image
            source={{ uri: project.coverUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-[34px] font-black" style={{ color: Colors.text }}>
            {project.avatarInitials}
          </Text>
        )}
      </View>

      <View className="px-4 py-4">
        <Text className="text-[18px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
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
