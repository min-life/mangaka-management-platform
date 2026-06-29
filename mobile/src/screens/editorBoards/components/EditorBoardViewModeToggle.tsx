import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

export type EditorBoardViewMode = 'list' | 'card';

interface EditorBoardViewModeToggleProps {
  viewMode: EditorBoardViewMode;
  onViewModeChange: (mode: EditorBoardViewMode) => void;
}

const VIEW_MODE_OPTIONS: Array<{ mode: EditorBoardViewMode; icon: string; label: string }> = [
  { mode: 'list', icon: 'view_list', label: 'List view' },
  { mode: 'card', icon: 'view_module', label: 'Card view' },
];

export default function EditorBoardViewModeToggle({
  viewMode,
  onViewModeChange,
}: EditorBoardViewModeToggleProps) {
  return (
    <View
      className="flex-row rounded-full p-1"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      {VIEW_MODE_OPTIONS.map((option) => {
        const isActive = viewMode === option.mode;

        return (
          <TouchableOpacity
            key={option.mode}
            activeOpacity={0.72}
            onPress={() => onViewModeChange(option.mode)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive }}
            className="h-9 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: isActive ? Colors.surfaceContainer : 'transparent',
            }}
          >
            <MaterialIcon
              name={option.icon}
              color={isActive ? Colors.text : Colors.textFaint}
              size={20}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
