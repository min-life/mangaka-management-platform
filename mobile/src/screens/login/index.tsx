import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import { login, loginWithGoogle } from '@/src/services/authApi';
import { saveAccessToken } from '@/src/services/tokenStorage';
import LoginBrandHeader from './components/LoginBrandHeader';
import LoginFormCard from './components/LoginFormCard';

export default function LoginScreen() {
  const navigation = useNavigation<RootStackNavProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (isLoading || isGoogleLoading || loginSuccess) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await login({
        email: normalizedEmail,
        password,
      });

      await saveAccessToken(response.accessToken);
      setIsLoading(false);
      setLoginSuccess(true);

      setTimeout(() => {
        navigation.replace('Home');
      }, 1200);
    } catch (error) {
      setIsLoading(false);
      setLoginSuccess(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.',
      );
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading || isGoogleLoading || loginSuccess) return;

    setErrorMessage('');
    setIsGoogleLoading(true);

    try {
      const response = await loginWithGoogle();

      await saveAccessToken(response.accessToken);
      setIsGoogleLoading(false);
      setLoginSuccess(true);

      setTimeout(() => {
        navigation.replace('Home');
      }, 600);
    } catch (error) {
      setIsGoogleLoading(false);
      setLoginSuccess(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể đăng nhập bằng Google. Vui lòng thử lại.',
      );
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrorMessage('');
    setLoginSuccess(false);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrorMessage('');
    setLoginSuccess(false);
  };

  const handleForgotPasswordPress = () => {
    navigation.navigate('ForgotPassword', {
      email: email.trim(),
    });
  };

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: 32,
            paddingHorizontal: 24,
            paddingTop: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full" style={{ alignSelf: 'center', gap: 40, maxWidth: 360 }}>
            <LoginBrandHeader />

            <LoginFormCard
              email={email}
              password={password}
              showPassword={showPassword}
              isLoading={isLoading}
              isGoogleLoading={isGoogleLoading}
              loginSuccess={loginSuccess}
              isFormValid={isFormValid}
              errorMessage={errorMessage}
              onEmailChange={handleEmailChange}
              onPasswordChange={handlePasswordChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onLogin={handleLogin}
              onForgotPassword={handleForgotPasswordPress}
              onGoogleLogin={handleGoogleLogin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
