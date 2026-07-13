import React from 'react';
import { TextInput, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface TasksSearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function TasksSearchBar({ search, onSearchChange }: TasksSearchBarProps) {
  return (
    <View className="relative w-full">
      <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
        <MaterialIcon name="search" color="rgba(237,241,251,0.5)" size={18} />
      </View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search tasks"
        placeholderTextColor="rgba(237,241,251,0.65)"
        className="h-11 rounded-lg pl-10 pr-4 text-[15px]"
        style={{
          backgroundColor: Colors.surface,
          color: Colors.text,
        }}
      />
    </View>
  );
}
