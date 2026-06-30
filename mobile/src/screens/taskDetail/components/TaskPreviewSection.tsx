import React from 'react';
import { View } from 'react-native';

import MangaPreviewCard from '@/src/components/sub-component/MangaPreviewCard';
import { TASK_INFO } from '@/src/constants/taskDetailData';
import { FrameAnnotation } from '@/src/types/taskDetail';

interface TaskPreviewSectionProps {
  imageUri?: string;
  selectedFrame?: FrameAnnotation | null;
  showStatusBadge?: boolean;
  status?: string;
}

export default function TaskPreviewSection({
  imageUri = TASK_INFO.previewImageUri,
  selectedFrame,
  showStatusBadge = true,
  status = TASK_INFO.status,
}: TaskPreviewSectionProps) {
  return (
    <>
      <View className="mt-4">
        <MangaPreviewCard
          imageUri={imageUri}
          status={status}
          selectedFrame={selectedFrame}
          showStatusBadge={showStatusBadge}
        />
      </View>

    </>
  );
}
