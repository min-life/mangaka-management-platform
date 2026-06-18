import React from 'react';
import { Text, TextInput, View, Animated } from 'react-native';

import CommentBubble from '@/src/components/sub-component/CommentBubble';
import FrameListPanel from '@/src/components/sub-component/FrameListPanel';
import { COMMENTS, FRAMES } from '@/src/constants/taskDetailData';
import { FrameAnnotation } from '@/src/types/taskDetail';
import { Colors } from '@/src/constants/colors';

import { C } from './theme';

interface DiscussionTabProps {
  comment: string;
  onCommentChange: (comment: string) => void;
  selectedFrame: FrameAnnotation | null;
  onSelectFrame: (frame: FrameAnnotation) => void;
}

export default function DiscussionTab({
  comment,
  onCommentChange,
  selectedFrame,
  onSelectFrame,
}: DiscussionTabProps) {
  // Lọc comments theo frame đang chọn
  const visibleComments = selectedFrame
    ? COMMENTS.filter((c) => c.frameId === selectedFrame.id)
    : [];

  return (
    <View className="mt-6 gap-5">
      {/* ── Tiêu đề section ──────────────────────────────────── */}
      <Text
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: Colors.textMuted, letterSpacing: 1.2 }}
      >
        Annotation Frames
      </Text>

      {/* ── Danh sách frame ──────────────────────────────────── */}
      <FrameListPanel
        frames={FRAMES}
        selectedFrameId={selectedFrame?.id ?? null}
        onSelectFrame={onSelectFrame}
      />

      {/* ── Comments của frame đang chọn ─────────────────────── */}
      {selectedFrame && (
        <View className="gap-4">
          {/* Divider + label */}
          <View className="flex-row items-center gap-3 mt-2">
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.borderFaint }} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#EF4444',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {selectedFrame.name}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.borderFaint }} />
          </View>

          {/* Comments */}
          {visibleComments.length > 0 ? (
            <View className="gap-4">
              {visibleComments.map((commentItem) => (
                <CommentBubble key={commentItem.id} comment={commentItem} />
              ))}
            </View>
          ) : (
            <View
              className="items-center py-6 rounded-xl"
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

          {/* Comment input */}
          <View
            className="flex-row items-center gap-3 rounded-xl px-4 py-2"
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: Colors.borderFaint,
            }}
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: C.surfaceHighest }}
            >
              <Text className="text-[10px] font-bold" style={{ color: C.text }}>
                ME
              </Text>
            </View>
            <TextInput
              value={comment}
              onChangeText={onCommentChange}
              placeholder={`Nhận xét về "${selectedFrame.name}"…`}
              placeholderTextColor={C.textFaint}
              className="flex-1 text-sm py-2 "
              style={{ color: C.text }}
              multiline
            />
          </View>
        </View>
      )}
    </View>
  );
}
