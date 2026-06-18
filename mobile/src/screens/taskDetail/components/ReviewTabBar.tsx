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
    <View className="flex-row mt-6" style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            className="flex-1 py-3 items-center"
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: C.accent } : {}}
          >
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: isActive ? C.accent : C.textMuted, opacity: isActive ? 1 : 0.6 }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

