import React from 'react';
import { View, Text } from 'react-native';

import MangaPreviewCard from '@/src/components/sub-component/MangaPreviewCard';
import { TASK_INFO } from '@/src/constants/taskDetailData';
import { FrameAnnotation } from '@/src/types/taskDetail';
import { Colors } from '@/src/constants/colors';

import { C } from './theme';

interface TaskPreviewSectionProps {
  selectedFrame?: FrameAnnotation | null;
}

export default function TaskPreviewSection({ selectedFrame }: TaskPreviewSectionProps) {
  return (
    <>
      <View className="mt-4">
        <MangaPreviewCard
          imageUri={TASK_INFO.previewImageUri}
          status={TASK_INFO.status}
          selectedFrame={selectedFrame}
        />
      </View>

    </>
  );
}
