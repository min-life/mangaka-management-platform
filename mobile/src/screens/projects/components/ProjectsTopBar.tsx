import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import { Colors } from '@/src/constants/colors';
import ProjectViewModeToggle, { ProjectViewMode } from './ProjectViewModeToggle';

interface ProjectsTopBarProps {
  onBack: () => void;
  onViewModeChange: (mode: ProjectViewMode) => void;
  viewMode: ProjectViewMode;
}

export default function ProjectsTopBar({
  onBack,
  onViewModeChange,
  viewMode,
}: ProjectsTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-16 justify-center px-4">
        <HeaderBackButton className="absolute left-3 z-10" onPress={onBack} />

        <Text
          className="text-center text-3xl font-bold leading-tight"
          style={{ color: Colors.text }}
          numberOfLines={1}
        >
          Projects
        </Text>

        <View className="absolute right-3 z-10">
          <ProjectViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </View>
      </View>
    </SafeAreaView>
  );
}
