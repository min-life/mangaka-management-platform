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
      className="h-14 rounded-xl items-center justify-center"
      style={{
        backgroundColor: loginSuccess
          ? Colors.statusDone
          : isFormValid
            ? Colors.accent
            : Colors.surfaceContainer,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.bg} />
      ) : loginSuccess ? (
        <View className="flex-row items-center gap-2">
          <MaterialIcon name="check_circle" color={Colors.bg} size={20} />
          <Text className="font-bold text-[16px]" style={{ color: Colors.bg }}>
            Welcome back!
          </Text>
        </View>
      ) : (
        <Text
          className="font-bold text-[16px]"
          style={{ color: isFormValid ? Colors.bg : Colors.textFaint }}
        >
          Login
        </Text>
      )}
    </TouchableOpacity>
  );
}

