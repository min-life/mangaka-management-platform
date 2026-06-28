import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { EditorBoardRole } from '@/src/types/editorBoards';

function getRoleColor(role: EditorBoardRole) {
  if (role === 'Owner') return Colors.accent;
  if (role === 'Lead') return Colors.statusProgress;
  return Colors.textMuted;
}

export default function BoardRoleBadge({ role }: { role: EditorBoardRole }) {
  const color = getRoleColor(role);

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}55` }}
    >
      <Text className="text-[11px] font-bold" style={{ color }}>
        {role}
      </Text>
    </View>
  );
}

