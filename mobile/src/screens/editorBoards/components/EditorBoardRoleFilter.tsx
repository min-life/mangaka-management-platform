import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EditorBoardRole } from '@/src/types/editorBoards';

export type EditorBoardRoleFilterValue = EditorBoardRole | 'All';

const ROLE_FILTERS: Array<{ label: string; value: EditorBoardRoleFilterValue }> = [
  { label: 'All roles', value: 'All' },
  { label: 'Owner', value: 'Owner' },
  { label: 'Lead', value: 'Lead' },
  { label: 'Member', value: 'Member' },
];

interface EditorBoardRoleFilterProps {
  activeRole: EditorBoardRoleFilterValue;
  onRoleChange: (role: EditorBoardRoleFilterValue) => void;
}

export default function EditorBoardRoleFilter({
  activeRole,
  onRoleChange,
}: EditorBoardRoleFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilter = activeRole !== 'All';

  return (
    <View style={{ position: 'relative', zIndex: isOpen ? 40 : 1 }}>
      <TouchableOpacity
        activeOpacity={0.76}
        onPress={() => setIsOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel="Filter editor boards"
        accessibilityState={{ expanded: isOpen, selected: hasActiveFilter }}
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{
          backgroundColor: hasActiveFilter ? 'rgba(255,211,105,0.14)' : Colors.surface,
          borderWidth: 1,
          borderColor: hasActiveFilter ? 'rgba(255,211,105,0.42)' : Colors.borderSubtle,
        }}
      >
        <MaterialIcon
          name="filter_list"
          color={hasActiveFilter ? Colors.accent : Colors.textMuted}
          size={22}
        />
        {hasActiveFilter ? (
          <View
            className="absolute right-2 top-2 h-2 w-2 rounded-full"
            style={{ backgroundColor: Colors.accent }}
          />
        ) : null}
      </TouchableOpacity>

      {isOpen ? (
        <View
          className="absolute right-0 rounded-xl p-2"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
            top: 56,
            width: 172,
            zIndex: 50,
          }}
        >
          {ROLE_FILTERS.map((role, index) => {
            const isActive = activeRole === role.value;

            return (
              <TouchableOpacity
                key={role.value}
                activeOpacity={0.72}
                onPress={() => {
                  onRoleChange(role.value);
                  setIsOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="flex-row items-center rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor: isActive ? 'rgba(255,211,105,0.12)' : 'transparent',
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: Colors.borderFaint,
                }}
              >
                <Text
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: isActive ? Colors.accent : Colors.text }}
                  numberOfLines={1}
                >
                  {role.label}
                </Text>
                {isActive ? <MaterialIcon name="check" color={Colors.accent} size={17} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
