import React from 'react';
import { TextInput, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface EditorBoardSearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function EditorBoardSearchBar({
  search,
  onSearchChange,
}: EditorBoardSearchBarProps) {
  return (
    <View className="relative">
      <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
        <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
      </View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search"
        placeholderTextColor="rgba(237,241,251,0.58)"
        accessibilityLabel="Search editor boards"
        className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
        style={{
          backgroundColor: Colors.surface,
          color: Colors.text,
        }}
      />
    </View>
  );
}
