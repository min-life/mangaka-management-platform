import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface ApiStateViewProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
  type: 'empty' | 'error' | 'loading';
}

export default function ApiStateView({ message, onRetry, title, type }: ApiStateViewProps) {
  const resolvedTitle =
    title ??
    (type === 'loading' ? 'Loading data' : type === 'error' ? 'Unable to load data' : 'No data');

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      {type === 'loading' ? <ActivityIndicator color={Colors.accent} size="small" /> : null}
      <Text className="mt-3 text-center text-[15px] font-bold" style={{ color: Colors.text }}>
        {resolvedTitle}
      </Text>
      {message ? (
        <Text
          className="mt-2 text-center text-[13px] leading-5"
          style={{ color: Colors.textMuted }}
        >
          {message}
        </Text>
      ) : null}
      {type === 'error' && onRetry ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onRetry}
          className="mt-4 rounded-full px-4 py-2"
          style={{ backgroundColor: Colors.surfaceContainer }}
        >
          <Text className="text-[13px] font-bold" style={{ color: Colors.text }}>
            Try again
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
