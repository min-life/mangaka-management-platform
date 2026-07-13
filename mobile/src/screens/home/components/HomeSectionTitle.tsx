import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

export default function HomeSectionTitle() {
  return (
    <View className="pt-5 pb-5">
      <Text className="text-2xl font-bold leading-tight" style={{ color: Colors.text }}>
        My Work
      </Text>
    </View>
  );
}
