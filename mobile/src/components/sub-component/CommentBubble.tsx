import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Comment } from '@/src/types/taskDetail';

interface CommentBubbleProps {
  comment: Comment;
  isHighlighted?: boolean;
}

/**
 * CommentBubble — Bubble thảo luận trong Discussion tab.
 * Hiển thị avatar initials, author badge, nội dung và mention.
 */
export default function CommentBubble({ comment, isHighlighted = false }: CommentBubbleProps) {
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
