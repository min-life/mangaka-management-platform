import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Contributor } from '@/src/types/taskDetail';

interface ContributorRowProps {
  contributor: Contributor;
}

/**
 * ContributorRow — Một dòng contributor trong Overview tab.
 */
export default function ContributorRow({ contributor }: ContributorRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      {/* Avatar với initials */}
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{
          backgroundColor: Colors.overlayLight,
          borderWidth: 1,
          borderColor: Colors.borderFaint,
        }}
      >
        <Text className="text-[10px] font-bold" style={{ color: Colors.accent }}>
          {contributor.initials}
        </Text>
      </View>

      {/* Tên & vai trò */}
      <View className="flex-1">
        <Text className="text-sm font-bold" style={{ color: Colors.text }}>
          {contributor.name}
        </Text>
        <Text className="text-[10px]" style={{ color: Colors.textMuted }}>
          {contributor.role}
        </Text>
      </View>

      {/* Verified badge */}
      {contributor.verified && (
        <View
          className="px-2 py-0.5 rounded-full flex-row items-center gap-1"
          style={{ backgroundColor: 'rgba(93,211,158,0.15)' }}
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: Colors.statusDone }}
          />
          <Text className="text-[10px] font-bold" style={{ color: Colors.statusDone }}>
            Verified
          </Text>
        </View>
      )}
    </View>
  );
}
