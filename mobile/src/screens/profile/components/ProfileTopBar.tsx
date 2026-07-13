import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/src/constants/colors';

export default function ProfileTopBar() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View
        className="flex-row justify-between items-center px-4 h-[72px]"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}
      >
        <Text className="text-[32px] font-bold tracking-tight" style={{ color: Colors.text }}>
          Profile
        </Text>

        <View className="h-10 w-10" />
      </View>
    </SafeAreaView>
  );
}

