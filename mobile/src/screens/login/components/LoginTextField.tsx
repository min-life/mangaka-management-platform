import React from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface LoginTextFieldProps extends TextInputProps {
  label: string;
  iconName: string;
  onToggleSecureText?: () => void;
  showSecureTextToggle?: boolean;
  secureTextVisible?: boolean;
}

export default function LoginTextField({
  label,
  iconName,
  onToggleSecureText,
  showSecureTextToggle,
  secureTextVisible,
  ...inputProps
}: LoginTextFieldProps) {
  return (
    <View className={showSecureTextToggle ? 'mb-5' : 'mb-4'}>
      <Text
        className="mb-2 text-[12px] font-semibold uppercase"
        style={{ color: Colors.textMuted }}
      >
        {label}
      </Text>
      <View className="relative">
        <View className="absolute left-4 z-10 h-12 items-center justify-center">
          <MaterialIcon name={iconName} color={Colors.textMuted} size={20} />
        </View>
        <TextInput
          {...inputProps}
          placeholderTextColor={Colors.textFaint}
          accessibilityLabel={label}
          className={`h-12 rounded-xl pl-12 text-[16px] ${showSecureTextToggle ? 'pr-12' : 'pr-4'}`}
          style={{
            backgroundColor: 'rgba(34,40,49,0.58)',
            color: Colors.text,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
          }}
          selectionColor={Colors.accent}
        />

        {showSecureTextToggle && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleSecureText}
            accessibilityLabel={secureTextVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            className="absolute right-2 h-12 w-10 items-center justify-center"
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
