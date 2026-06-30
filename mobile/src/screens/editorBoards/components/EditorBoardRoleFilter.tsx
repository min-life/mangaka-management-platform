import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardRole } from '@/src/types/editorBoards';

export type EditorBoardRoleFilterValue = EditorBoardRole | 'All';

const ROLE_FILTERS: EditorBoardRoleFilterValue[] = ['All', 'Owner', 'Lead', 'Member'];

interface EditorBoardRoleFilterProps {
  activeRole: EditorBoardRoleFilterValue;
  onRoleChange: (role: EditorBoardRoleFilterValue) => void;
}

export default function EditorBoardRoleFilter({
  activeRole,
  onRoleChange,
}: EditorBoardRoleFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4"
      contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
    >
      {ROLE_FILTERS.map((role) => {
        const isActive = activeRole === role;

        return (
          <TouchableOpacity
            key={role}
            activeOpacity={0.72}
            onPress={() => onRoleChange(role)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{
              backgroundColor: isActive ? Colors.surfaceContainer : Colors.surface,
              borderWidth: 1,
              borderColor: isActive ? 'rgba(237,241,251,0.18)' : Colors.borderFaint,
            }}
          >
            <Text className="text-[15px] font-medium" style={{ color: Colors.text }}>
              {role === 'All' ? 'Role' : role}
            </Text>
            <MaterialIcon name="expand_more" color={Colors.textFaint} size={20} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
