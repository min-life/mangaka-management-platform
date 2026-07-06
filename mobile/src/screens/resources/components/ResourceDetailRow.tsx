import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceNode } from '@/src/types/resources';

import { formatResourceDate } from './resourceFormatters';

interface ResourceDetailRowProps {
  node: ResourceNode;
  isLast: boolean;
  onPress: () => void;
}

export default function ResourceDetailRow({ node, isLast, onPress }: ResourceDetailRowProps) {
  const isChapter = node.type === 'folder';
  const thumbnailUri =
    node.type === 'folder' ? node.coverUri : (node.previewImageUri ?? node.coverUri);
  const typeLabel = isChapter ? 'Chapter' : 'Page';
  const statusColor = isChapter ? Colors.statusDone : Colors.statusReview;
  const dateLabel = formatResourceDate(node.updatedAt || node.createdAt);

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isChapter ? 'Chapter' : 'Page'} ${node.name}`}
      className={isLast ? 'mx-4 mb-0' : 'mx-4 mb-3'}
    >
      <View
        className="flex-row items-center rounded-2xl p-3"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.borderFaint,
        }}
      >
        <View
          className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl"
          style={{
            backgroundColor: thumbnailUri
              ? Colors.surfaceContainer
              : isChapter
                ? 'rgba(230,161,75,0.22)'
                : 'rgba(77,166,255,0.18)',
          }}
        >
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <MaterialIcon
              name={isChapter ? 'description' : 'image'}
              color={isChapter ? Colors.iconFolder : Colors.statusProgress}
              size={25}
            />
          )}
        </View>

        <View className="ml-4 flex-1 justify-center">
          <Text className="text-[15px] font-black" style={{ color: Colors.text }} numberOfLines={1}>
            {node.name}
          </Text>

          <View className="mt-2 flex-row items-center">
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${statusColor}22` }}
            >
              <Text className="text-[9px] font-black uppercase" style={{ color: statusColor }}>
                {typeLabel}
              </Text>
            </View>
            <Text className="ml-2 text-[11px] font-semibold" style={{ color: Colors.textMuted }}>
              {dateLabel}
            </Text>
          </View>
        </View>

        <View className="pl-3">
          <MaterialIcon name="chevron_right" color={Colors.textFaint} size={22} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
