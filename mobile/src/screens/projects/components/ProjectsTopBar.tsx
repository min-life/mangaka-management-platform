import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectsTopBarProps {
  onBack: () => void;
}

export default function ProjectsTopBar({ onBack }: ProjectsTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-16 justify-center px-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="absolute left-3 z-10 flex-row items-center rounded-full py-2 pr-3"
        >
          <MaterialIcon name="arrow_back" color={Colors.statusProgress} size={22} />
          <Text className="ml-1 text-[15px] font-medium" style={{ color: Colors.statusProgress }}>
            Back
          </Text>
        </TouchableOpacity>

        <Text
          className="text-center text-3xl font-bold leading-tight"
          style={{ color: Colors.text }}
          numberOfLines={1}
        >
          Projects
        </Text>
      </View>
    </SafeAreaView>
  );
}
