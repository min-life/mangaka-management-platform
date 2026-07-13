import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

import LoginSubmitButton from './LoginSubmitButton';
import LoginTextField from './LoginTextField';

interface LoginFormCardProps {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  isGoogleLoading: boolean;
  loginSuccess: boolean;
  isFormValid: boolean;
  errorMessage?: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onForgotPassword: () => void;
  onGoogleLogin: () => void;
}

export default function LoginFormCard({
  email,
  password,
  showPassword,
  isLoading,
  isGoogleLoading,
  loginSuccess,
  isFormValid,
  errorMessage,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onForgotPassword,
  onGoogleLogin,
}: LoginFormCardProps) {
  const [rememberMe, setRememberMe] = React.useState(false);
  const isBusy = isLoading || isGoogleLoading;

  return (
    <View className="w-full">
      <LoginTextField
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        showLeadingIcon={false}
      />

      <LoginTextField
        label="Password"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        showSecureTextToggle
        secureTextVisible={showPassword}
        onToggleSecureText={onTogglePassword}
        showLeadingIcon={false}
      />

      <View className="mb-4 flex-row items-center justify-between px-1">
        <TouchableOpacity
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe, disabled: isBusy }}
          className="min-h-8 flex-row items-center gap-2"
          disabled={isBusy}
          onPress={() => setRememberMe((current) => !current)}
        >
          <View
            className="h-4 w-4 items-center justify-center rounded"
            style={{
              backgroundColor: rememberMe ? Colors.accent : 'transparent',
              borderColor: rememberMe ? Colors.accent : Colors.borderFaint,
              borderWidth: 1,
            }}
          >
            {rememberMe ? <MaterialIcon name="check" color={Colors.bg} size={12} /> : null}
          </View>
          <Text className="text-[13px] font-semibold" style={{ color: Colors.textMuted }}>
            Remember me
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={isBusy ? 1 : 0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy }}
          className="min-h-8 items-center justify-center"
          disabled={isBusy}
          onPress={onForgotPassword}
        >
          <Text className="text-[13px] font-semibold" style={{ color: Colors.accent }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>

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

      <LoginSubmitButton
        isFormValid={isFormValid && !isGoogleLoading}
        isLoading={isLoading}
        loginSuccess={loginSuccess}
        onPress={onLogin}
      />

      <View className="my-4 flex-row items-center gap-2">
        <View className="h-px flex-1" style={{ backgroundColor: Colors.borderFaint }} />
        <Text className="text-[11px] font-semibold uppercase" style={{ color: Colors.textMuted }}>
          or
        </Text>
        <View className="h-px flex-1" style={{ backgroundColor: Colors.borderFaint }} />
      </View>

      <TouchableOpacity
        activeOpacity={isBusy ? 1 : 0.85}
        accessibilityRole="button"
        accessibilityState={{ busy: isGoogleLoading, disabled: isBusy }}
        className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
        disabled={isBusy}
        onPress={onGoogleLogin}
        style={{
          backgroundColor: 'rgba(34,40,49,0.58)',
          borderColor: Colors.borderFaint,
          borderWidth: 1,
          opacity: isBusy && !isGoogleLoading ? 0.72 : 1,
        }}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color={Colors.text} size="small" />
        ) : (
          <View
            className="h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.surfaceContainer }}
          >
            <Text className="text-[12px] font-bold" style={{ color: Colors.text }}>
              G
            </Text>
          </View>
        )}
        <Text className="text-[13px] font-semibold" style={{ color: Colors.text }}>
          {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <Text className="mt-8 text-center text-[13px] leading-5" style={{ color: Colors.textMuted }}>
        By signing in you accept our{' '}
        <Text style={{ color: Colors.accent, fontWeight: '500' }}>Terms of Use</Text> and{' '}
        <Text style={{ color: Colors.accent, fontWeight: '500' }}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}
