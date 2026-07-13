import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface LoginSubmitButtonProps {
  isFormValid: boolean;
  isLoading: boolean;
  loginSuccess: boolean;
  onPress: () => void;
}

export default function LoginSubmitButton({
  isFormValid,
  isLoading,
  loginSuccess,
  onPress,
}: LoginSubmitButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={isFormValid ? 0.85 : 1}
      onPress={onPress}
      disabled={!isFormValid || isLoading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isFormValid || isLoading, busy: isLoading }}
      className="h-12 items-center justify-center rounded-xl"
      style={{
        backgroundColor: loginSuccess
          ? Colors.statusDone
          : isFormValid
            ? Colors.accent
            : Colors.surfaceContainer,
        borderColor: isFormValid || loginSuccess ? 'transparent' : Colors.borderFaint,
        borderWidth: 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.bg} />
      ) : loginSuccess ? (
        <View className="flex-row items-center gap-2">
          <MaterialIcon name="check_circle" color={Colors.bg} size={20} />
          <Text className="font-bold text-[16px]" style={{ color: Colors.bg }}>
            Signed In
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <Text
            className="font-bold text-[16px]"
            style={{ color: isFormValid ? Colors.bg : Colors.textFaint }}
          >
            Sign In
          </Text>
          {isFormValid ? <MaterialIcon name="arrow_forward" color={Colors.bg} size={17} /> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}
