import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import { Colors } from '@/src/constants/colors';
import ResourceViewModeToggle, { ResourceViewMode } from './ResourceViewModeToggle';

interface ResourceTopBarProps {
  backLabel: string;
  onBack: () => void;
  onViewModeChange: (mode: ResourceViewMode) => void;
  title: string;
  viewMode: ResourceViewMode;
}

export default function ResourceTopBar({
  backLabel,
  onBack,
  onViewModeChange,
  title,
  viewMode,
}: ResourceTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-16 justify-center px-4">
        <HeaderBackButton
          accessibilityLabel={`Back to ${backLabel}`}
          className="absolute left-3 z-10"
          onPress={onBack}
        />

        <Text
          className="mx-24 text-center text-3xl font-bold leading-tight"
          style={{ color: Colors.text }}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View className="absolute right-3 z-10">
          <ResourceViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </View>
      </View>
    </SafeAreaView>
  );
}
