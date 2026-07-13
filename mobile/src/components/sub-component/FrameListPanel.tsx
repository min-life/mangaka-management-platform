import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { FrameAnnotation } from '@/src/types/taskDetail';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Comment } from '@/src/types/taskDetail';

interface FrameListPanelProps {
  comments?: Comment[];
  frames: FrameAnnotation[];
  selectedFrameId: string | null;
  onSelectFrame: (frame: FrameAnnotation) => void;
}

/**
 * FrameListPanel — Danh sách dọc các frame annotation của trang manga.
 * Click vào frame → khoanh vùng đỏ trên ảnh + hiển thị comments của frame đó.
 */
export default function FrameListPanel({
  comments = [],
  frames,
  selectedFrameId,
  onSelectFrame,
}: FrameListPanelProps) {
  return (
    <View className="gap-2">
      {frames.map((frame, index) => {
        const isSelected = frame.id === selectedFrameId;
        const commentCount = comments.filter((c) => c.frameId === frame.id).length;

        return (
          <TouchableOpacity
            key={`${frame.id}-${index}`}
            activeOpacity={0.75}
            onPress={() => onSelectFrame(frame)}
            style={{
              backgroundColor: isSelected ? 'rgba(239,68,68,0.12)' : Colors.surface,
              borderWidth: 1,
              borderColor: isSelected ? '#EF4444' : Colors.borderFaint,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Index số */}
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: isSelected ? '#EF4444' : Colors.overlayLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isSelected ? '#fff' : Colors.textMuted,
                }}
              >
                {index + 1}
              </Text>
            </View>

            {/* Tên & mô tả */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSelected ? '#EF4444' : Colors.text,
                }}
              >
                {frame.name}
              </Text>
              {frame.description && (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}
                >
                  {frame.description}
                </Text>
              )}
            </View>

            {/* Comment count badge */}
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {commentCount > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: isSelected
                      ? 'rgba(239,68,68,0.2)'
                      : Colors.overlayLight,
                    borderRadius: 99,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <MaterialIcon
                    name="comment"
                    color={isSelected ? '#EF4444' : Colors.textMuted}
                    size={11}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: isSelected ? '#EF4444' : Colors.textMuted,
                    }}
                  >
                    {commentCount}
                  </Text>
                </View>
              )}

              {/* Arrow chỉ hướng */}
              <MaterialIcon
                name={isSelected ? 'expand_less' : 'expand_more'}
                color={isSelected ? '#EF4444' : Colors.textFaint}
                size={18}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
