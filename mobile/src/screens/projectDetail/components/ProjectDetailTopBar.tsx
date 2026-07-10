import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectDetailTopBarProps {
  onBack: () => void;
  onMorePress?: () => void;
}

export default function ProjectDetailTopBar({ onBack, onMorePress }: ProjectDetailTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-16 flex-row items-center justify-between px-3">
        <HeaderBackButton iconSize={24} onPress={onBack} />

        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel="More project actions"
            className="h-10 w-10 items-center justify-center rounded-full"
            disabled={!onMorePress}
            onPress={onMorePress}
          >
            <MaterialIcon name="more_vert" color={"#ffff"} size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
