import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
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

        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <MaterialIcon name="settings" color={Colors.text} size={22} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

