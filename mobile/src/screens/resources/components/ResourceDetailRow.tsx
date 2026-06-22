import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceNode } from '@/src/types/resources';

interface ResourceDetailRowProps {
  node: ResourceNode;
  isLast: boolean;
  onPress: () => void;
}

export default function ResourceDetailRow({
  node,
  isLast,
  onPress,
}: ResourceDetailRowProps) {
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
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{
          backgroundColor: isFolder
            ? 'rgba(77,166,255,0.16)'
            : 'rgba(237,241,251,0.08)',
        }}
      >
        <MaterialIcon
          name={isFolder ? 'folder' : 'file'}
          color={isFolder ? '#79BDF8' : Colors.textMuted}
          size={22}
        />
      </View>

      <View
        className="ml-4 flex-1 flex-row items-center py-3"
        style={{
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: Colors.borderFaint,
        }}
      >
        <View className="flex-1">
          <Text
            className="text-[15px] font-medium"
            style={{ color: Colors.text }}
            numberOfLines={1}
          >
            {node.name}
          </Text>
          <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }}>
            {isFolder ? 'Folder' : node.language}
          </Text>
        </View>

        <View className="mr-4">
          <MaterialIcon name="chevron_right" color={Colors.textFaint} size={23} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
