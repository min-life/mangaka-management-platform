import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardMember } from '@/src/types/editorBoards';

import BoardRoleBadge from './BoardRoleBadge';

export default function BoardMemberRow({ member }: { member: EditorBoardMember }) {
  return (
    <View
      className="rounded-xl p-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: Colors.iconBg }}
        >
          <Text className="text-[12px] font-bold" style={{ color: Colors.accent }}>
            {member.initials}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
            {member.name}
          </Text>
          <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }}>
            {member.email}
          </Text>
        </View>
        <BoardRoleBadge role={member.role} />
      </View>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
          {member.joinedAtLabel}
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: Colors.overlayLight }}>
            <MaterialIcon name="star" color={Colors.accent} size={17} />
          </TouchableOpacity>
          <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: Colors.overlayLight }}>
            <MaterialIcon name="delete" color="#EF4444" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

