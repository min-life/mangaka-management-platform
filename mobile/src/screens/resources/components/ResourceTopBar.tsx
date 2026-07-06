import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
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
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={`Back to ${backLabel}`}
          className="absolute left-3 z-10 flex-row items-center py-2 pr-3"
        >
          <MaterialIcon name="arrow_back" color={Colors.statusProgress} size={20} />
          <Text className="ml-1 text-[15px] font-bold" style={{ color: Colors.statusProgress }}>
            {backLabel}
          </Text>
        </TouchableOpacity>

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
