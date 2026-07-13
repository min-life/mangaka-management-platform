import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectBranchRowProps {
  branch: string;
}

export default function ProjectBranchRow({ branch }: ProjectBranchRowProps) {
  return (
    <View
      className="mt-4 flex-row items-center justify-between px-4 py-4"
      style={{
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <View className="flex-row items-center">
        <MaterialIcon name="fork" color={Colors.textFaint} size={20} />
        <Text
          className="ml-4 text-[12px]"
          style={{ color: Colors.textMuted, fontFamily: 'monospace' }}
        >
          {branch}
        </Text>
        <Text className="ml-2 text-[12px]" style={{ color: Colors.statusDone }}>
          ✓
        </Text>
      </View>

      <Text className="text-[15px] font-medium" style={{ color: Colors.statusProgress }}>
        Change branch
      </Text>
    </View>
  );
}
