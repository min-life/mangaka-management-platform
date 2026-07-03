import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectDetailTopBarProps {
  onBack: () => void;
}

export default function ProjectDetailTopBar({ onBack }: ProjectDetailTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-16 flex-row items-center justify-between px-3">
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <MaterialIcon name="arrow_back" color={Colors.statusProgress} size={24} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel="More project actions"
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <MaterialIcon name="more_vert" color={Colors.statusProgress} size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
