import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
      className="rounded-[18px] p-6"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <LoginTextField
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        placeholder="artist@mangaka.studio"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <LoginTextField
        label="Password"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        showSecureTextToggle
        secureTextVisible={showPassword}
        onToggleSecureText={onTogglePassword}
      />

      {errorMessage ? (
        <View
          className="mb-4 rounded-xl px-4 py-3"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
        >
          <Text className="text-[13px] leading-5" style={{ color: Colors.iconTask }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {successMessage ? (
        <View
          className="mb-4 rounded-xl px-4 py-3"
          style={{ backgroundColor: 'rgba(93,211,158,0.12)' }}
        >
          <Text className="text-[13px] leading-5" style={{ color: Colors.statusDone }}>
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
        className="mt-6 items-center"
        disabled={isLoading || isForgotLoading}
        onPress={onForgotPassword}
      >
        <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
          {isForgotLoading ? 'Sending reset link...' : 'Forgot password?'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
