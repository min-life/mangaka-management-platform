import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ReviewTab } from '@/src/types/taskDetail';

import { C } from './theme';

const TABS: ReviewTab[] = ['Overview', 'Discussion', 'Action'];

interface ReviewTabBarProps {
  activeTab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
}

export default function ReviewTabBar({ activeTab, onTabChange }: ReviewTabBarProps) {
  return (
    <View className="mt-6 flex-row" style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.78}
            onPress={() => onTabChange(tab)}
            className="flex-1 items-center py-3"
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: C.accent } : undefined}
          >
            <Text
              className="text-xs font-bold uppercase"
              style={{ color: isActive ? C.accent : C.textMuted }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
