import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface MarkdownLiteProps {
  content: string;
}

export default function MarkdownLite({ content }: MarkdownLiteProps) {
  const lines = content.trim().split('\n');
  let inCodeBlock = false;

  return (
    <View className="px-4 pb-8 pt-8">
      {lines.map((rawLine, index) => {
        const line = rawLine.trimEnd();

        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          return null;
        }

        if (inCodeBlock) {
          return (
            <View
              key={`${line}-${index}`}
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: Colors.surface }}
            >
              <Text
                className="text-[13px] leading-5"
                style={{ color: Colors.text, fontFamily: 'monospace' }}
              >
                {line}
              </Text>
            </View>
          );
        }

        if (line.length === 0) {
          return <View key={`space-${index}`} className="h-4" />;
        }

        if (line.startsWith('# ')) {
          return (
            <Text
              key={`${line}-${index}`}
              className="text-3xl font-bold leading-tight"
              style={{ color: Colors.text }}
            >
              {line.replace('# ', '')}
            </Text>
          );
        }

        if (line.startsWith('## ')) {
          return (
            <View key={`${line}-${index}`} className="mt-6">
              <Text className="text-[22px] font-bold" style={{ color: Colors.text }}>
                {line.replace('## ', '')}
              </Text>
              <View className="mt-3 h-px" style={{ backgroundColor: Colors.borderFaint }} />
            </View>
          );
        }

        if (line.startsWith('- ')) {
          return (
            <View key={`${line}-${index}`} className="ml-6 flex-row">
              <Text className="mr-3 text-[15px] leading-6" style={{ color: Colors.text }}>
                •
              </Text>
              <Text className="flex-1 text-[15px] font-medium leading-6" style={{ color: Colors.text }}>
                {line.replace('- ', '')}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={`${line}-${index}`}
            className="text-[15px] font-medium leading-6"
            style={{ color: Colors.text }}
          >
            {line}
          </Text>
        );
      })}
    </View>
  );
}
