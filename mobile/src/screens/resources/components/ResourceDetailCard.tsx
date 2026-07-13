import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceNode } from '@/src/types/resources';

import { formatResourceDate, getResourceInitials } from './resourceFormatters';

interface ResourceDetailCardProps {
  node: ResourceNode;
  onPress: () => void;
}

export default function ResourceDetailCard({ node, onPress }: ResourceDetailCardProps) {
  const isChapter = node.type === 'folder';
  const thumbnailUri =
    node.type === 'folder' ? node.coverUri : (node.previewImageUri ?? node.coverUri);
  const typeLabel = isChapter ? 'Chapter' : 'Page';
  const statusColor = isChapter ? Colors.statusDone : Colors.statusReview;
  const dateLabel = formatResourceDate(node.updatedAt || node.createdAt);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel} ${node.name}`}
      className="mb-3 overflow-hidden rounded-2xl"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
        width: '48.2%',
      }}
    >
      <View
        className="h-[116px] w-full items-center justify-center overflow-hidden"
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
          <Text className="text-[24px] font-black" style={{ color: Colors.text }}>
            {getResourceInitials(node.name) || (isChapter ? 'CH' : 'PG')}
          </Text>
        )}
      </View>

      <View className="p-3">
        <Text className="text-[14px] font-black" style={{ color: Colors.text }} numberOfLines={2}>
          {node.name}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${statusColor}22` }}
          >
            <Text className="text-[9px] font-black uppercase" style={{ color: statusColor }}>
              {typeLabel}
            </Text>
          </View>
          <MaterialIcon name="chevron_right" color={Colors.textFaint} size={18} />
        </View>

        <Text className="mt-2 text-[11px] font-semibold" style={{ color: Colors.textMuted }}>
          {dateLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
