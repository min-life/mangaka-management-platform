import React from 'react';
import { TouchableOpacity } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

export type ProjectViewMode = 'list' | 'card';

interface ProjectViewModeToggleProps {
  viewMode: ProjectViewMode;
  onViewModeChange: (mode: ProjectViewMode) => void;
}

export default function ProjectViewModeToggle({
  viewMode,
  onViewModeChange,
}: ProjectViewModeToggleProps) {
  const nextMode: ProjectViewMode = viewMode === 'list' ? 'card' : 'list';
  const iconName = viewMode === 'list' ? 'view_list' : 'view_module';
  const accessibilityLabel = nextMode === 'list' ? 'Switch to list view' : 'Switch to card view';

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-full"
      onPress={() => onViewModeChange(nextMode)}
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <MaterialIcon name={iconName} color={Colors.text} size={22} />
    </TouchableOpacity>
  );
}
