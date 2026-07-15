import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import { login } from '@/src/services/authApi';
import { saveSession } from '@/src/services/tokenStorage';
import LoginBrandHeader from './components/LoginBrandHeader';
import LoginFormCard from './components/LoginFormCard';

export default function LoginScreen() {
  const navigation = useNavigation<RootStackNavProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (isLoading || loginSuccess) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await login({
        email: normalizedEmail,
        password,
      });

      await saveSession(response.accessToken, response.refreshToken);
      setIsLoading(false);
      setLoginSuccess(true);

      setTimeout(() => {
        navigation.replace('Home');
      }, 1200);
    } catch (error) {
      setIsLoading(false);
      setLoginSuccess(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
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
              loginSuccess={loginSuccess}
              isFormValid={isFormValid}
              errorMessage={errorMessage}
              onEmailChange={handleEmailChange}
              onPasswordChange={handlePasswordChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onLogin={handleLogin}
              onForgotPassword={handleForgotPasswordPress}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
