import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

import LoginSubmitButton from './LoginSubmitButton';
import LoginTextField from './LoginTextField';

interface LoginFormCardProps {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  isForgotLoading: boolean;
  loginSuccess: boolean;
  isFormValid: boolean;
  errorMessage?: string;
  successMessage?: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onForgotPassword: () => void;
}

export default function LoginFormCard({
  email,
  password,
  showPassword,
  isLoading,
  isForgotLoading,
  loginSuccess,
  isFormValid,
  errorMessage,
  successMessage,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onForgotPassword,
}: LoginFormCardProps) {
  return (
    <View
      className="rounded-[20px] p-5"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderFaint,
        borderWidth: 1,
      }}
    >
      <View className="mb-5">
        <Text className="text-[22px] font-bold" style={{ color: Colors.text }}>
          Sign in
        </Text>
        <Text className="mt-1 text-[13px] leading-5" style={{ color: Colors.textMuted }}>
          Use your studio account to continue.
        </Text>
      </View>

      <LoginTextField
        label="Email"
        iconName="mail"
        value={email}
        onChangeText={onEmailChange}
        placeholder="artist@mangaka.studio"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <LoginTextField
        label="Password"
        iconName="lock"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        showSecureTextToggle
        secureTextVisible={showPassword}
        onToggleSecureText={onTogglePassword}
      />

      {errorMessage ? (
        <View
          accessibilityRole="alert"
          className="mb-4 flex-row rounded-xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(239,68,68,0.12)',
            borderColor: 'rgba(239,68,68,0.22)',
            borderWidth: 1,
          }}
        >
          <MaterialIcon name="error" color={Colors.iconTask} size={18} />
          <Text className="ml-2 flex-1 text-[13px] leading-5" style={{ color: Colors.text }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {successMessage ? (
        <View
          accessibilityRole="alert"
          className="mb-4 flex-row rounded-xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(93,211,158,0.12)',
            borderColor: 'rgba(93,211,158,0.22)',
            borderWidth: 1,
          }}
        >
          <MaterialIcon name="check_circle" color={Colors.statusDone} size={18} />
          <Text className="ml-2 flex-1 text-[13px] leading-5" style={{ color: Colors.text }}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      <LoginSubmitButton
        isFormValid={isFormValid}
        isLoading={isLoading}
        loginSuccess={loginSuccess}
        onPress={onLogin}
      />

      <TouchableOpacity
        activeOpacity={isLoading || isForgotLoading ? 1 : 0.7}
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading || isForgotLoading }}
        className="mt-5 h-11 items-center justify-center"
        disabled={isLoading || isForgotLoading}
        onPress={onForgotPassword}
      >
        <Text className="text-[13px] font-semibold" style={{ color: Colors.textMuted }}>
          {isForgotLoading ? 'Sending reset link...' : 'Forgot your password?'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
