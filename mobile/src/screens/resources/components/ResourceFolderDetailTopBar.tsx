import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ResourceFolderDetailTopBarProps {
  onBack: () => void;
}

export default function ResourceFolderDetailTopBar({
  onBack,
}: ResourceFolderDetailTopBarProps) {
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
            accessibilityLabel="Add resource item"
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <MaterialIcon name="add" color={Colors.statusProgress} size={27} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel="More resource actions"
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <MaterialIcon name="more_vert" color={Colors.statusProgress} size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
