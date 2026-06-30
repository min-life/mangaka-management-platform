import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

export default function HomeSectionTitle() {
  return (
    <View className="py-6">
      <Text className="text-3xl font-bold leading-tight" style={{ color: Colors.text }}>
        My Work
      </Text>
    </View>
  );
}

