import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
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
      className="overflow-hidden rounded-xl"
      style={{
        width: '48%',
      }}
    >
      <View
        className="w-full items-center justify-center overflow-hidden rounded-xl"
        style={{
          aspectRatio: 0.68,
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
          <Text className="text-[34px] font-black" style={{ color: Colors.text }}>
            {project.avatarInitials}
          </Text>
        )}
      </View>

      <View className="pt-3">
        <Text className="text-[15px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
          {project.name}
        </Text>
        <View className="mt-1 flex-row items-center justify-between gap-2">
          <Text
            className="flex-1 text-[12px] font-semibold"
            style={{ color: 'rgba(237,241,251,0.72)' }}
            numberOfLines={1}
          >
            {project.createdByName}
          </Text>
          <View className="flex-row items-center gap-1">
            <MaterialIcon name="star" color={Colors.accent} size={14} />
            <Text
              className="text-[12px] font-semibold"
              style={{ color: Colors.text, fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
            >
              {project.stars}
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-[11px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {dateRange}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
