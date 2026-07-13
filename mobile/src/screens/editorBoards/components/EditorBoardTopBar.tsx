import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface EditorBoardTopBarProps {
  actionIcon?: string;
  onActionPress?: () => void;
  onBack: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
  title: string;
}

export default function EditorBoardTopBar({
  actionIcon,
  onActionPress,
  onBack,
  rightAction,
  subtitle,
  title,
}: EditorBoardTopBarProps) {
  if (!subtitle && !actionIcon) {
    return (
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
        <View className="h-16 justify-center px-4">
          <HeaderBackButton className="absolute left-3 z-10" onPress={onBack} />

          {rightAction ? <View className="absolute right-3 top-2 z-10">{rightAction}</View> : null}

          <Text
            className="text-center text-3xl font-bold leading-tight"
            style={{ color: Colors.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View
        className="flex-row items-center px-4 h-16"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}
      >
        <HeaderBackButton onPress={onBack} />
        <View className="flex-1 px-2">
          {subtitle && (
            <Text
              className="text-[11px] font-bold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 1.1 }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          <Text className="text-[20px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {actionIcon ? (
          <TouchableOpacity
            activeOpacity={0.72}
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel="Board action"
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.overlayLight }}
          >
            <MaterialIcon name={actionIcon} color={Colors.text} size={22} />
          </TouchableOpacity>
        ) : rightAction ? (
          rightAction
        ) : (
          <View className="w-10" />
        )}
      </View>
    </SafeAreaView>
  );
}
