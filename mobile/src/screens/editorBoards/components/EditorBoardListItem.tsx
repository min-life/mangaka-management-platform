import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardItem } from '@/src/types/editorBoards';

import BoardRoleBadge from './BoardRoleBadge';

interface EditorBoardListItemProps {
  board: EditorBoardItem;
  isLast: boolean;
  onPress?: () => void;
}

export default function EditorBoardListItem({ board, isLast, onPress }: EditorBoardListItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="flex-row px-4 py-3"
      accessibilityRole="button"
      accessibilityLabel={`${board.name}, ${board.currentUserRole}, ${board.updatedAtLabel}`}
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.borderFaint,
      }}
    >
      <View
        className="h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: Colors.iconBg }}
      >
        <MaterialIcon name="groups" color={Colors.accent} size={30} />
      </View>

      <View className="ml-4 flex-1 justify-center">
        <View className="flex-row items-center gap-2">
          <Text
            className="flex-1 text-[16px] font-bold"
            style={{ color: Colors.text }}
            numberOfLines={1}
          >
            {board.name}
          </Text>
          <BoardRoleBadge role={board.currentUserRole} />
        </View>
        <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {board.updatedAtLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
