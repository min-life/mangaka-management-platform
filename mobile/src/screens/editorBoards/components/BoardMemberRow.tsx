import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardMember } from '@/src/types/editorBoards';

import BoardRoleBadge from './BoardRoleBadge';

interface BoardMemberRowProps {
  member: EditorBoardMember;
  onChangeRole: (member: EditorBoardMember) => void;
  onDelete: (member: EditorBoardMember) => void;
}

export default function BoardMemberRow({ member, onChangeRole, onDelete }: BoardMemberRowProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <View
      className="rounded-xl p-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        zIndex: isMenuOpen ? 30 : 1,
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
        <View className="min-w-0 flex-1 flex-row items-center">
          <MaterialIcon name="calendar_today" color={Colors.textFaint} size={14} />
          <Text
            className="ml-1.5 flex-1 text-[12px]"
            style={{ color: Colors.textFaint }}
            numberOfLines={1}
          >
            {member.joinedAtLabel}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${member.name}`}
            className="h-8 w-8 items-center justify-center rounded-full"
            onPress={() => setIsMenuOpen((current) => !current)}
            style={{ backgroundColor: Colors.overlayLight }}
          >
            <MaterialIcon name="edit" color={Colors.textMuted} size={17} />
          </TouchableOpacity>
        </View>
      </View>

      {isMenuOpen ? (
        <View
          className="absolute right-3 top-28 overflow-hidden rounded-xl"
          style={{
            backgroundColor: Colors.surfaceContainer,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
            elevation: 12,
            minWidth: 150,
            zIndex: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityRole="button"
            className="flex-row items-center px-3 py-3"
            onPress={() => {
              setIsMenuOpen(false);
              onChangeRole(member);
            }}
            style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderFaint }}
          >
            <MaterialIcon name="manage_accounts" color={Colors.accent} size={17} />
            <Text className="ml-2 text-[13px] font-semibold" style={{ color: Colors.text }}>
              Change role
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityRole="button"
            className="flex-row items-center px-3 py-3"
            onPress={() => {
              setIsMenuOpen(false);
              onDelete(member);
            }}
          >
            <MaterialIcon name="delete" color="#EF4444" size={17} />
            <Text className="ml-2 text-[13px] font-semibold" style={{ color: '#EF4444' }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
