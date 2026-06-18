import React from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface LoginTextFieldProps extends TextInputProps {
  label: string;
  onToggleSecureText?: () => void;
  showSecureTextToggle?: boolean;
  secureTextVisible?: boolean;
}

export default function LoginTextField({
  label,
  onToggleSecureText,
  showSecureTextToggle,
  secureTextVisible,
  ...inputProps
}: LoginTextFieldProps) {
  return (
    <View className={showSecureTextToggle ? 'mb-6' : 'mb-5'}>
      <Text className="text-[12px] font-medium mb-1.5" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
      <View className="relative">
        <TextInput
          {...inputProps}
          placeholderTextColor={Colors.textFaint}
          className={`h-12 pl-4 rounded-xl text-[16px] ${
            showSecureTextToggle ? 'pr-12' : 'pr-4'
          }`}
          style={{
            backgroundColor: Colors.surfaceContainer,
            color: Colors.text,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
          selectionColor={Colors.accent}
        />

        {showSecureTextToggle && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleSecureText}
            className="absolute right-3 h-12 items-center justify-center"
            style={{ top: 0 }}
          >
            <MaterialIcon
              name={secureTextVisible ? 'visibility_off' : 'visibility'}
              color={Colors.textMuted}
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

