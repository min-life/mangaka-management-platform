import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface EditorBoardTopBarProps {
  actionIcon?: string;
  onActionPress?: () => void;
  onBack: () => void;
  subtitle?: string;
  title: string;
}

export default function EditorBoardTopBar({
  actionIcon,
  onActionPress,
  onBack,
  subtitle,
  title,
}: EditorBoardTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View
        className="flex-row items-center px-4 h-16"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}
      >
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <MaterialIcon name="arrow_back" color={Colors.text} size={21} />
        </TouchableOpacity>
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
        ) : (
          <View className="w-10" />
        )}
      </View>
    </SafeAreaView>
  );
}

