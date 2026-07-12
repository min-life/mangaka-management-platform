import React from 'react';
import { Image, Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { ProjectItem } from '@/src/types/projects';

interface ProjectDetailHeroProps {
  project: ProjectItem;
}

function formatProjectDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function ProjectDetailHero({ project }: ProjectDetailHeroProps) {
  const timeline = `${formatProjectDate(project.createdAt)} - ${formatProjectDate(
    project.updatedAt,
  )}`;

  return (
    <View className="pb-6">
      <View
        className="h-[260px] overflow-hidden"
        style={{
          backgroundColor: project.avatarBg,
        }}
      >
        {project.coverUri ? (
          <Image
            source={{ uri: project.coverUri }}
            className="h-full w-full"
            resizeMode="contain"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="text-[54px] font-black" style={{ color: Colors.text }}>
              {project.avatarInitials}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4">
        <Text
          className="mt-5 text-[31px] font-black leading-tight"
          style={{ color: Colors.text }}
          numberOfLines={2}
        >
          {project.name}
        </Text>

        <Text className="mt-3 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
          {project.description ?? 'Project workspace for manga production and review.'}
        </Text>

        <Text className="mt-4 text-[13px] leading-5" style={{ color: Colors.textFaint }}>
          {timeline}
        </Text>
      </View>
    </View>
  );
}
