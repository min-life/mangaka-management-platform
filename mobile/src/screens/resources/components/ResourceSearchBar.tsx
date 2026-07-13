import React from 'react';
import { TextInput, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ResourceSearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function ResourceSearchBar({ search, onSearchChange }: ResourceSearchBarProps) {
  return (
    <View className="relative flex-1">
      <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
        <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
      </View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search resources"
        placeholderTextColor="rgba(237,241,251,0.65)"
        accessibilityLabel="Search resources"
        className="h-11 rounded-lg pl-10 pr-4 text-[15px]"
        style={{ backgroundColor: Colors.surface, color: Colors.text }}
      />
    </View>
  );
}
