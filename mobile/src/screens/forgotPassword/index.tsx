import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { forgotPassword } from '@/src/services/authApi';
import LoginTextField from '@/src/screens/login/components/LoginTextField';

type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORGOT_SUCCESS_MESSAGE = 'If the email exists, reset instructions have been sent.';

export default function ForgotPasswordScreen({ navigation, route }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const normalizedEmail = email.trim().toLowerCase();
  const isFormValid = EMAIL_PATTERN.test(normalizedEmail);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (!normalizedEmail) {
      setSuccessMessage('');
      setErrorMessage('Please enter your email to reset your password.');
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setSuccessMessage('');
      setErrorMessage('Invalid email address.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await forgotPassword(normalizedEmail);
      setSuccessMessage(FORGOT_SUCCESS_MESSAGE);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (
        message === 'Unable to connect to the API. Please check the server or URL config.' ||
        message === 'The server is having an issue. Please try again later.'
      ) {
        setErrorMessage(message);
      } else {
        setSuccessMessage(FORGOT_SUCCESS_MESSAGE);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingBottom: 28,
            paddingTop: 36,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HeaderBackButton
            accessibilityLabel="Back to login"
            className="mb-6"
            onPress={() => navigation.goBack()}
          />

          <View
            className="rounded-[20px] p-5"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.borderFaint,
              borderWidth: 1,
            }}
          >
            <View className="mb-5">
              <Text className="text-[24px] font-bold" style={{ color: Colors.text }}>
                Reset password
              </Text>
              <Text className="mt-2 text-[13px] leading-5" style={{ color: Colors.textMuted }}>
                Enter your account email. We will send password reset instructions if the account
                exists.
              </Text>
            </View>

            <LoginTextField
              autoCapitalize="none"
              autoCorrect={false}
              iconName="mail"
              keyboardType="email-address"
              label="Email"
              onChangeText={handleEmailChange}
              placeholder="artist@mangaka.studio"
              value={email}
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

            <TouchableOpacity
              activeOpacity={isFormValid ? 0.85 : 1}
              accessibilityRole="button"
              accessibilityState={{ busy: isLoading, disabled: !isFormValid || isLoading }}
              className="h-14 flex-row items-center justify-center gap-2 rounded-xl"
              disabled={!isFormValid || isLoading}
              onPress={handleSubmit}
              style={{
                backgroundColor: isFormValid ? Colors.accent : Colors.surfaceContainer,
                borderColor: isFormValid ? 'transparent' : Colors.borderFaint,
                borderWidth: 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.bg} />
              ) : (
                <>
                  <Text
                    className="text-[16px] font-bold"
                    style={{ color: isFormValid ? Colors.bg : Colors.textFaint }}
                  >
                    Send reset link
                  </Text>
                  {isFormValid ? (
                    <MaterialIcon name="arrow_forward" color={Colors.bg} size={17} />
                  ) : null}
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="button"
              className="mt-5 h-11 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-[13px] font-semibold" style={{ color: Colors.textMuted }}>
                Back to sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
