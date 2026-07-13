import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
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
        <HeaderBackButton
          accessibilityLabel={`Back to ${backLabel}`}
          className="absolute left-3 z-10"
          onPress={onBack}
        />

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
