import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ProjectItem } from '@/src/types/projects';

interface ProjectDetailHeroProps {
  project: ProjectItem;
}

export default function ProjectDetailHero({ project }: ProjectDetailHeroProps) {
  return (
    <View className="px-4 pb-6 pt-5">
      <View className="flex-row items-center">
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: project.avatarBg }}
        >
          <Text className="text-[12px] font-bold" style={{ color: Colors.text }}>
            {project.avatarInitials}
          </Text>
        </View>
        <Text
          className="ml-3 flex-1 text-[15px]"
          style={{ color: 'rgba(237,241,251,0.68)' }}
          numberOfLines={1}
        >
          {project.owner}
        </Text>
      </View>

      <Text
        className="mt-5 text-3xl font-bold leading-tight"
        style={{ color: Colors.text }}
        numberOfLines={2}
      >
        {project.name}
      </Text>

      <View className="mt-5 flex-row items-center">
        <Text className="ml-3 flex-1 text-[15px]" style={{ color: Colors.text }} numberOfLines={1}>
          {'Chổ này là description'}
        </Text>
      </View>
    </View>
  );
}
