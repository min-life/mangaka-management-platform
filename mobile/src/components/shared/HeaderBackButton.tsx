import React from 'react';
import { TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors } from '@/src/constants/colors';
import MaterialIcon from './MaterialIcon';

interface HeaderBackButtonProps {
  accessibilityLabel?: string;
  className?: string;
  iconSize?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function HeaderBackButton({
  accessibilityLabel = 'Go back',
  className,
  iconSize = 22,
  onPress,
  style,
}: HeaderBackButtonProps) {
  const buttonClassName = ['h-10 w-10 items-center justify-center rounded-full', className]
    .filter(Boolean)
    .join(' ');

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={buttonClassName}
      onPress={onPress}
      style={style}
    >
      <MaterialIcon name="arrow_back" color={Colors.text} size={iconSize} />
    </TouchableOpacity>
  );
}
