import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import CommentBubble from '@/src/components/sub-component/CommentBubble';
import FrameListPanel from '@/src/components/sub-component/FrameListPanel';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Comment, FrameAnnotation } from '@/src/types/taskDetail';
import { Colors } from '@/src/constants/colors';

import { C } from './theme';

const INITIAL_COMMENT_COUNT = 5;
const COMMENT_BATCH_COUNT = 5;

interface DiscussionTabProps {
  comments: Comment[];
  frames: FrameAnnotation[];
  selectedFrame: FrameAnnotation | null;
  onSelectFrame: (frame: FrameAnnotation) => void;
}

export default function DiscussionTab({
  comments,
  frames,
  selectedFrame,
  onSelectFrame,
}: DiscussionTabProps) {
  const visibleComments = selectedFrame
    ? comments.filter((c) => c.frameId === selectedFrame.id)
    : comments;
  const [visibleCommentCount, setVisibleCommentCount] = React.useState(INITIAL_COMMENT_COUNT);
  const recentComments = visibleComments.slice(
    Math.max(0, visibleComments.length - visibleCommentCount),
  );
  const hiddenCommentCount = Math.max(0, visibleComments.length - recentComments.length);

  React.useEffect(() => {
    setVisibleCommentCount(INITIAL_COMMENT_COUNT);
  }, [selectedFrame?.id]);

  return (
    <View className="mt-6 gap-4">
      <View
        className="gap-4 rounded-xl p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.035)',
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="text-[12px] font-bold uppercase"
            style={{ color: C.textMuted, letterSpacing: 1.1 }}
          >
            Frames
          </Text>
          <Text className="text-[12px]" style={{ color: C.textFaint }}>
            Tap a frame to focus
          </Text>
        </View>

        <FrameListPanel
          comments={comments}
          frames={frames}
          selectedFrameId={selectedFrame?.id ?? null}
          onSelectFrame={onSelectFrame}
        />

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <MaterialIcon name="comment" color={C.accent} size={18} />
            <Text className="text-[13px] font-bold uppercase" style={{ color: C.text }}>
              {selectedFrame?.name ?? 'Discussion'}
            </Text>
          </View>

          {recentComments.length > 0 ? (
            <View className="gap-3">
              {hiddenCommentCount > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  className="self-center rounded-full px-3 py-2"
                  onPress={() =>
                    setVisibleCommentCount((currentCount) =>
                      Math.min(visibleComments.length, currentCount + COMMENT_BATCH_COUNT),
                    )
                  }
                  style={{
                    backgroundColor: C.surface,
                    borderColor: C.borderFaint,
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
                    Xem {Math.min(hiddenCommentCount, COMMENT_BATCH_COUNT)} bình luận cũ
                  </Text>
                </TouchableOpacity>
              ) : null}
              {recentComments.map((commentItem, index) => (
                <CommentBubble key={`${commentItem.id}-${index}`} comment={commentItem} />
              ))}
            </View>
          ) : (
            <View
              className="items-center rounded-xl py-6"
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.borderSubtle,
              }}
            >
              <Text style={{ color: Colors.textFaint, fontSize: 14 }}>
                Chưa có comment nào cho frame này
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
