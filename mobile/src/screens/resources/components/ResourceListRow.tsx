import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceNode } from '@/src/types/resources';

interface ResourceListRowProps {
  node: ResourceNode;
  isLast: boolean;
  onPress: () => void;
}

export default function ResourceListRow({ node, isLast, onPress }: ResourceListRowProps) {
  const isFolder = node.type === 'folder';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isFolder ? 'Folder' : 'File'} ${node.name}`}
      className="flex-row items-center pl-4"
      style={{ minHeight: 58 }}
    >
      <MaterialIcon
        name={isFolder ? 'folder' : 'file'}
        color={isFolder ? '#79BDF8' : Colors.textMuted}
        size={24}
      />

      <View
        className="ml-4 flex-1 flex-row items-center py-[18px]"
        style={{
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: Colors.borderFaint,
        }}
      >
        <Text className="flex-1 text-[15px] font-medium" style={{ color: Colors.text }}>
          {node.name}
        </Text>
        <View className="mr-4">
          <MaterialIcon name="chevron_right" color={Colors.textFaint} size={18} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
