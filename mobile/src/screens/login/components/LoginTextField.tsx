import React from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface LoginTextFieldProps extends TextInputProps {
  label: string;
  iconName?: string;
  showLeadingIcon?: boolean;
  onToggleSecureText?: () => void;
  showSecureTextToggle?: boolean;
  secureTextVisible?: boolean;
}

export default function LoginTextField({
  label,
  iconName,
  showLeadingIcon = true,
  onToggleSecureText,
  showSecureTextToggle,
  secureTextVisible,
  ...inputProps
}: LoginTextFieldProps) {
  const shouldShowLeadingIcon = showLeadingIcon && Boolean(iconName);
  const inputPaddingClass = `${shouldShowLeadingIcon ? 'pl-12' : 'pl-4'} ${
    showSecureTextToggle ? 'pr-12' : 'pr-4'
  }`;

  return (
    <View className={showSecureTextToggle ? 'mb-5' : 'mb-4'}>
      <Text className="mb-2 ml-1 text-[12px] font-semibold" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
      <View className="relative">
        {shouldShowLeadingIcon ? (
          <View className="absolute left-4 z-10 h-12 items-center justify-center">
            <MaterialIcon name={iconName ?? ''} color={Colors.textMuted} size={20} />
          </View>
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor={Colors.textFaint}
          accessibilityLabel={label}
          className={`h-12 rounded-xl text-[16px] ${inputPaddingClass}`}
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
