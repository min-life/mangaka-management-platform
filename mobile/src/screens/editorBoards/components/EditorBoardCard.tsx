import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { getBoardMembers, getBoardPublishRequests } from '@/src/constants/editorBoardsData';
import { EditorBoardItem } from '@/src/types/editorBoards';

import BoardRoleBadge from './BoardRoleBadge';

interface EditorBoardCardProps {
  board: EditorBoardItem;
  onPress: () => void;
}

export default function EditorBoardCard({ board, onPress }: EditorBoardCardProps) {
  const memberCount = getBoardMembers(board).length;
  const pendingCount = getBoardPublishRequests(board).filter(
    (application) => application.status === 'PENDING',
  ).length;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${board.name}`}
      className="rounded-xl p-4"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: Colors.iconBg }}
        >
          <MaterialIcon name="groups" color={Colors.accent} size={24} />
        </View>
        <View className="flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-[16px] font-bold" style={{ color: Colors.text }}>
              {board.name}
            </Text>
            <BoardRoleBadge role={board.currentUserRole} />
          </View>
          <Text className="text-[13px] leading-5" style={{ color: Colors.textMuted }} numberOfLines={2}>
            {board.description}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row justify-between">
        <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
          {memberCount} members
        </Text>
        <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
          {board.projectIds.length} projects
        </Text>
        <Text className="text-[12px]" style={{ color: Colors.statusReview }}>
          {pendingCount} pending
        </Text>
      </View>
    </TouchableOpacity>
  );
}

