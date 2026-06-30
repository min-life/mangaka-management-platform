import React, { useState, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import { forgotPassword, login } from '@/src/services/authApi';
import { saveAccessToken } from '@/src/services/tokenStorage';
import DevGoHomeButton from './components/DevGoHomeButton';
import LoginBrandHeader from './components/LoginBrandHeader';
import LoginFormCard from './components/LoginFormCard';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORGOT_SUCCESS_MESSAGE = 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.';

export default function LoginScreen() {
  const navigation = useNavigation<RootStackNavProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fade-in animation cho header
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTransY = useRef(new Animated.Value(-12)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerTransY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (isLoading || isForgotLoading || loginSuccess) return;

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
    setSuccessMessage('');
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

  const handleForgotPassword = async () => {
    if (isLoading || isForgotLoading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setSuccessMessage('');
      setErrorMessage('Vui lòng nhập email để đặt lại mật khẩu.');
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setSuccessMessage('');
      setErrorMessage('Email không hợp lệ.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsForgotLoading(true);

    try {
      await forgotPassword(normalizedEmail);
      setSuccessMessage(FORGOT_SUCCESS_MESSAGE);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (
        message === 'Không thể kết nối tới API. Vui lòng kiểm tra server hoặc cấu hình URL.' ||
        message === 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
      ) {
        setErrorMessage(message);
      } else {
        setSuccessMessage(FORGOT_SUCCESS_MESSAGE);
      }
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrorMessage('');
    setSuccessMessage('');
    setLoginSuccess(false);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrorMessage('');
    setSuccessMessage('');
    setLoginSuccess(false);
  };

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <View
        className="absolute left-[-80px] top-[-80px] h-56 w-56 rounded-full"
        style={{ backgroundColor: 'rgba(255,211,105,0.08)' }}
        pointerEvents="none"
      />
      <View
        className="absolute bottom-[-96px] right-[-72px] h-64 w-64 rounded-full"
        style={{ backgroundColor: 'rgba(93,211,158,0.07)' }}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 28,
            paddingTop: 36,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <LoginBrandHeader opacity={headerOpacity} translateY={headerTransY} />
          </View>

          <View className="mt-8">
            <LoginFormCard
              email={email}
              password={password}
              showPassword={showPassword}
              isLoading={isLoading}
              isForgotLoading={isForgotLoading}
              loginSuccess={loginSuccess}
              isFormValid={isFormValid}
              errorMessage={errorMessage}
              successMessage={successMessage}
              onEmailChange={handleEmailChange}
              onPasswordChange={handlePasswordChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onLogin={handleLogin}
              onForgotPassword={handleForgotPassword}
            />
            <DevGoHomeButton onPress={() => navigation.navigate('Home')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
