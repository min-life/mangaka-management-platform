import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

export type BoardTab = 'Overview' | 'Projects' | 'Members' | 'Publish';

const tabs: BoardTab[] = ['Overview', 'Projects', 'Members', 'Publish'];

interface BoardTabBarProps {
  activeTab: BoardTab;
  onChange: (tab: BoardTab) => void;
}

export default function BoardTabBar({ activeTab, onChange }: BoardTabBarProps) {
  return (
    <View className="mt-5 flex-row" style={{ borderBottomWidth: 1, borderColor: Colors.borderSubtle }}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.72}
            onPress={() => onChange(tab)}
            className="flex-1 items-center py-3"
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: Colors.accent } : {}}
          >
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: isActive ? Colors.accent : Colors.textMuted }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

