import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ResourceFileTopBarProps {
  backLabel: string;
  title: string;
  subtitle: string;
  onBack: () => void;
}

export default function ResourceFileTopBar({
  backLabel,
  title,
  subtitle,
  onBack,
}: ResourceFileTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View
        className="h-[74px] justify-center px-3"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderFaint }}
      >
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

        <View className="mx-24 items-center">
          <Text
            className="text-center text-[16px] font-bold"
            style={{ color: Colors.textMuted }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="mt-0.5 text-center text-[12px] font-semibold"
            style={{ color: Colors.textMuted }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>

        <View className="absolute right-3">
          <MaterialIcon name="more_vert" color={Colors.statusProgress} size={20} />
        </View>
      </View>
    </SafeAreaView>
  );
}
