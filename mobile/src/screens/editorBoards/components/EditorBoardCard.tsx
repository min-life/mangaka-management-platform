import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardItem } from '@/src/types/editorBoards';

import BoardRoleBadge from './BoardRoleBadge';

interface EditorBoardCardProps {
  board: EditorBoardItem;
  onPress: () => void;
}

export default function EditorBoardCard({ board, onPress }: EditorBoardCardProps) {
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
        className="h-[150px] w-full items-center justify-center"
        style={{ backgroundColor: Colors.iconBg }}
      >
        <MaterialIcon name="groups" color={Colors.accent} size={42} />
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
      </View>
    </TouchableOpacity>
  );
}
