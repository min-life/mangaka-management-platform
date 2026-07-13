import React from 'react';
import { TextInput, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectsSearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function ProjectsSearchBar({ search, onSearchChange }: ProjectsSearchBarProps) {
  return (
    <View className="relative w-full">
      <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
        <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
      </View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search projects"
        placeholderTextColor="rgba(237,241,251,0.65)"
        accessibilityLabel="Search projects"
        className="h-11 rounded-lg pl-10 pr-4 text-[15px]"
        style={{
          backgroundColor: Colors.surface,
          color: Colors.text,
        }}
      />
    </View>
  );
}
