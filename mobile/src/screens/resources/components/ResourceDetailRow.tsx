import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceNode } from '@/src/types/resources';

import { getPageCount } from './resourceFormatters';

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
  const isChapter = node.type === 'folder';
  const helperText = isChapter
    ? `${getPageCount(node)} page${getPageCount(node) === 1 ? '' : 's'}`
    : node.description ?? node.language;

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isChapter ? 'Chapter' : 'Page'} ${node.name}`}
      className={isLast ? 'mx-4 mb-0' : 'mx-4 mb-3'}
    >
      <View
        className="flex-row rounded-2xl p-4"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.borderFaint,
        }}
      >
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: isChapter
              ? 'rgba(230,161,75,0.22)'
              : 'rgba(77,166,255,0.18)',
          }}
        >
          <MaterialIcon
            name={isChapter ? 'description' : 'image'}
            color={isChapter ? Colors.iconFolder : Colors.statusProgress}
            size={24}
          />
        </View>

        <View className="ml-4 flex-1">
          <View className="flex-row items-center">
            <Text
              className="flex-1 text-[16px] font-bold"
              style={{ color: Colors.text }}
              numberOfLines={1}
            >
              {node.name}
            </Text>
            <MaterialIcon name="chevron_right" color={Colors.textFaint} size={22} />
          </View>

          <Text className="mt-1 text-[12px] font-semibold" style={{ color: Colors.textFaint }}>
            {isChapter ? 'Chapter' : 'Manga page'}
          </Text>

          <Text className="mt-2 text-[13px] leading-5" style={{ color: Colors.textMuted }} numberOfLines={2}>
            {helperText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
