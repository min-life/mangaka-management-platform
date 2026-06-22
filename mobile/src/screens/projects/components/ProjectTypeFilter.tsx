import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { PROJECT_TYPE_FILTERS } from '@/src/constants/projectsData';
import { ProjectType } from '@/src/types/projects';

export type ProjectTypeFilterValue = ProjectType | 'All';

interface ProjectTypeFilterProps {
  activeType: ProjectTypeFilterValue;
  onTypeChange: (type: ProjectTypeFilterValue) => void;
}

export default function ProjectTypeFilter({ activeType, onTypeChange }: ProjectTypeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4"
      contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
    >
      {PROJECT_TYPE_FILTERS.map((type) => {
        const isActive = activeType === type;

        return (
          <TouchableOpacity
            key={type}
            activeOpacity={0.72}
            onPress={() => onTypeChange(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{
              backgroundColor: isActive ? Colors.surfaceContainer : Colors.surface,
              borderWidth: 1,
              borderColor: isActive ? 'rgba(237,241,251,0.18)' : Colors.borderFaint,
            }}
          >
            <Text className="text-[15px] font-medium" style={{ color: Colors.text }}>
              {type === 'All' ? 'Type' : type}
            </Text>
            <MaterialIcon name="expand_more" color={Colors.textFaint} size={20} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
