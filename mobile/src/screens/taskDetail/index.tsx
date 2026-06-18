import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavProp } from '@/src/navigation/types';
import { FrameAnnotation, ReviewTab } from '@/src/types/taskDetail';
import {
  ActionTab,
  C,
  DiscussionTab,
  OverviewTab,
  ReviewTabBar,
  TaskDetailTopBar,
  TaskPreviewSection,
} from './components';

export default function TaskDetailScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [activeTab, setActiveTab] = useState<ReviewTab>('Overview');
  const [comment, setComment] = useState('');

  /**
   * selectedFrame — frame đang được highlight trên ảnh.
   * Được dùng bởi cả TaskPreviewSection (vẽ bounding box)
   * và DiscussionTab (lọc comments).
   */
  const [selectedFrame, setSelectedFrame] = useState<FrameAnnotation | null>(null);

  const handleSelectFrame = (frame: FrameAnnotation) => {
    // Toggle: click lại frame đang chọn thì bỏ chọn
    setSelectedFrame((prev) => (prev?.id === frame.id ? null : frame));
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TaskDetailTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh preview + progress bar — selectedFrame điều khiển bounding box */}
        <TaskPreviewSection selectedFrame={selectedFrame} />

        <ReviewTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'Overview' && <OverviewTab />}

        {activeTab === 'Discussion' && (
          <DiscussionTab
            comment={comment}
            onCommentChange={setComment}
            selectedFrame={selectedFrame}
            onSelectFrame={handleSelectFrame}
          />
        )}

        {activeTab === 'Action' && <ActionTab />}
      </ScrollView>
    </View>
  );
}
