import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import { Colors } from '@/src/constants/colors';

interface ResourceFolderDetailTopBarProps {
  onBack: () => void;
}

export default function ResourceFolderDetailTopBar({ onBack }: ResourceFolderDetailTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-14 flex-row items-center justify-between px-3">
        <HeaderBackButton onPress={onBack} />
        <View className="w-10" />
      </View>
    </SafeAreaView>
  );
}
