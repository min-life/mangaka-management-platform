import React from 'react';
import { View } from 'react-native';

import MangaPreviewCard from '@/src/components/sub-component/MangaPreviewCard';
import { FrameAnnotation } from '@/src/types/taskDetail';

interface TaskPreviewSectionProps {
  imageUri?: string;
  selectedFrame?: FrameAnnotation | null;
  showStatusBadge?: boolean;
  status?: string;
}

export default function TaskPreviewSection({
  imageUri,
  selectedFrame,
  showStatusBadge = true,
  status = 'Preview',
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
