import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Comment } from '@/src/types/taskDetail';

interface CommentBubbleProps {
  comment: Comment;
}

/**
 * CommentBubble — Bubble thảo luận trong Discussion tab.
 * Hiển thị avatar initials, author badge, nội dung và mention.
 */
export default function CommentBubble({ comment }: CommentBubbleProps) {
  return (
    <View className="flex-row gap-3">
      {/* Avatar */}
      <View className="items-center">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          <Text className="text-xs font-bold" style={{ color: Colors.accent }}>
            {comment.initials}
          </Text>
        </View>
      </View>

      {/* Bubble */}
      <View
        className="flex-1 rounded-xl overflow-hidden"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.borderFaint,
        }}
      >
        {/* Header */}
        <View
          className="flex-row justify-between items-center px-4 py-2"
          style={{ backgroundColor: Colors.surfaceContainer }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="font-bold text-sm" style={{ color: Colors.text }}>
              {comment.author}
            </Text>
            <Text className="text-xs" style={{ color: Colors.textFaint }}>
              {comment.time}
            </Text>
          </View>
          {comment.authorRole ? (
            <View
              className="px-2 py-0.5 rounded-full"
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

        {/* Body */}
        <View className="px-4 py-3">
          <Text style={{ color: Colors.text, lineHeight: 22 }}>
            {comment.body}
            {comment.mention && (
              <Text style={{ color: Colors.accent, fontWeight: '500' }}>
                {comment.mention}
              </Text>
            )}
            {comment.mention ? ' check this out.' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}
