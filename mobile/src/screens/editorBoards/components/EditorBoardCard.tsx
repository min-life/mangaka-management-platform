import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardItem } from '@/src/types/editorBoards';

import BoardRoleBadge from './BoardRoleBadge';

interface EditorBoardCardProps {
  board: EditorBoardItem;
  onPress: () => void;
}

export default function EditorBoardCard({ board, onPress }: EditorBoardCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(board.imageUrl && !hasImageError);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${board.name}`}
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <View
        className="h-[150px] w-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: Colors.iconBg }}
      >
        {shouldShowImage ? (
          <Image
            source={{ uri: board.imageUrl! }}
            className="h-full w-full"
            onError={() => setHasImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <MaterialIcon name="groups" color={Colors.accent} size={42} />
        )}
      </View>

      <View className="px-4 py-4">
        <View className="flex-row items-start gap-3">
          <View className="flex-1">
            <Text
              className="text-[18px] font-bold"
              style={{ color: Colors.text }}
              numberOfLines={1}
            >
              {board.name}
            </Text>
          </View>
          <BoardRoleBadge role={board.currentUserRole} />
        </View>

        <Text className="mt-2 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {board.updatedAtLabel}
        </Text>

        <View className="mt-4 gap-2">
          <View className="flex-row items-center">
            <MaterialIcon name="person" color={Colors.textFaint} size={15} />
            <Text
              className="ml-2 flex-1 text-[12px]"
              numberOfLines={1}
              style={{ color: Colors.textMuted }}
            >
              Created by {board.createdByName}
            </Text>
          </View>
          <View className="flex-row items-center">
            <MaterialIcon name="calendar_today" color={Colors.textFaint} size={15} />
            <Text className="ml-2 text-[12px]" style={{ color: Colors.textMuted }}>
              Created {board.createdAtLabel}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
