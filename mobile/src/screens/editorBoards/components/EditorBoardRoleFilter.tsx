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
  const activeLabel = activeRole === 'All' ? 'All' : activeRole;

  return (
    <View
      className="relative py-1"
      style={{
        borderBottomColor: Colors.borderSubtle,
        borderBottomWidth: 1,
        zIndex: isOpen ? 40 : 1,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.76}
        onPress={() => setIsOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel="Filter editor boards"
        accessibilityState={{ expanded: isOpen, selected: hasActiveFilter }}
        className="h-10 flex-row items-center self-start rounded-full px-3"
        style={{
          backgroundColor: isOpen || hasActiveFilter ? Colors.surfaceContainer : Colors.surface,
          borderWidth: 1,
          borderColor: hasActiveFilter ? 'rgba(255,211,105,0.42)' : Colors.borderSubtle,
        }}
      >
        <MaterialIcon
          name="filter_list"
          color={hasActiveFilter ? Colors.accent : Colors.textMuted}
          size={19}
        />
        <Text
          className="ml-2 text-[13px] font-bold"
          numberOfLines={1}
          style={{ color: hasActiveFilter ? Colors.accent : Colors.text }}
        >
          {activeLabel}
        </Text>
        <MaterialIcon
          name={isOpen ? 'expand_less' : 'expand_more'}
          color={Colors.textMuted}
          size={18}
        />
      </TouchableOpacity>

      {isOpen ? (
        <View
          className="absolute left-0 top-12 w-44 overflow-hidden rounded-2xl"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
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
                className="flex-row items-center px-3 py-3"
                style={{
                  backgroundColor: isActive ? Colors.surfaceContainer : Colors.surface,
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
