import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Comment } from '@/src/types/taskDetail';

interface CommentBubbleProps {
  comment: Comment;
  isHighlighted?: boolean;
  onPressFrameContext?: (frameId: string) => void;
  onPressMaterialContext?: (materialId: string) => void;
}

function ContextChip({
  disabled,
  label,
  onPress,
  value,
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  value: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.72}
      className="rounded-full px-2 py-1"
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: 'rgba(255,211,105,0.12)',
        borderColor: 'rgba(255,211,105,0.26)',
        borderWidth: 1,
        maxWidth: '100%',
      }}
    >
      <Text className="text-[10px] font-bold" numberOfLines={1} style={{ color: Colors.accent }}>
        {label}: <Text style={{ color: Colors.text }}>{value}</Text>
      </Text>
    </TouchableOpacity>
  );
}

/**
 * CommentBubble — Bubble thảo luận trong Discussion tab.
 * Hiển thị avatar initials, author badge, nội dung và mention.
 */
export default function CommentBubble({
  comment,
  isHighlighted = false,
  onPressFrameContext,
  onPressMaterialContext,
}: CommentBubbleProps) {
  const frameLabel = comment.frameName || (comment.frameId ? `Frame ${comment.frameId}` : '');
  const materialLabel =
    comment.materialName || (comment.materialId ? `Material ${comment.materialId}` : '');
  const hasContext = Boolean(frameLabel || materialLabel);

  return (
    <View className="flex-row items-end gap-2">
      <View className="items-center pb-1">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{
            backgroundColor: Colors.surfaceContainer,
            borderWidth: 1,
            borderColor: isHighlighted ? Colors.accent : Colors.borderFaint,
          }}
        >
          <Text className="text-[10px] font-bold" style={{ color: Colors.accent }}>
            {comment.initials}
          </Text>
        </View>
      </View>

      <View className="flex-1 items-start">
        <View className="mb-1 flex-row items-center gap-2 px-1" style={{ maxWidth: '82%' }}>
          <Text numberOfLines={1} className="text-[12px] font-bold" style={{ color: Colors.text }}>
            {comment.author}
          </Text>
          <Text className="text-[11px]" style={{ color: Colors.textFaint }}>
            {comment.time}
          </Text>
          {comment.authorRole ? (
            <View
              className="rounded-full px-2 py-0.5"
              style={{
                backgroundColor: 'rgba(255,211,105,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255,211,105,0.3)',
              }}
            >
              <Text className="text-[10px] font-bold" style={{ color: Colors.accent }}>
                {comment.authorRole}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          className="rounded-2xl rounded-bl-md px-4 py-3"
          style={{
            alignSelf: 'flex-start',
            backgroundColor: isHighlighted ? 'rgba(255,211,105,0.12)' : Colors.surface,
            borderColor: isHighlighted ? Colors.accent : Colors.borderFaint,
            borderWidth: 1,
            maxWidth: '82%',
          }}
        >
          {hasContext ? (
            <View className="mb-2 flex-row flex-wrap gap-1.5">
              {materialLabel ? (
                <ContextChip
                  disabled={!comment.materialId || !onPressMaterialContext}
                  label="Material"
                  value={materialLabel}
                  onPress={() => {
                    if (comment.materialId) onPressMaterialContext?.(comment.materialId);
                  }}
                />
              ) : null}
              {frameLabel ? (
                <ContextChip
                  disabled={!comment.frameId || !onPressFrameContext}
                  label="Frame"
                  value={frameLabel}
                  onPress={() => {
                    if (comment.frameId) onPressFrameContext?.(comment.frameId);
                  }}
                />
              ) : null}
            </View>
          ) : null}

          <Text style={{ color: Colors.text, lineHeight: 22 }}>
            {comment.body}
            {comment.mention && (
              <Text style={{ color: Colors.accent, fontWeight: '500' }}>{comment.mention}</Text>
            )}
            {comment.mention ? ' check this out.' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}
