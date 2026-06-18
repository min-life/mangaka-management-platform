import React, { useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { FrameAnnotation } from '@/src/types/taskDetail';
import MaterialIcon from '@/src/components/shared/MaterialIcon';

interface MangaPreviewCardProps {
  imageUri: string;
  status: string;
  selectedFrame?: FrameAnnotation | null;
}

/**
 * MangaPreviewCard — Khung xem trước trang manga với:
 * - Badge status nhấp nháy
 * - Bounding box đỏ khi có frame được chọn
 */
export default function MangaPreviewCard({
  imageUri,
  status,
  selectedFrame,
}: MangaPreviewCardProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const frameOpacity = useRef(new Animated.Value(0)).current;
  const frameScale = useRef(new Animated.Value(1.08)).current;

  // Pulse cho status badge
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.65, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  // Animate bounding box khi frame thay đổi
  React.useEffect(() => {
    if (selectedFrame) {
      frameOpacity.setValue(0);
      frameScale.setValue(1.08);
      Animated.parallel([
        Animated.timing(frameOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(frameScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(frameOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [selectedFrame?.id]);

  return (
    <View
      className="w-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
        aspectRatio: 3 / 4,
      }}
    >
      <Image
        source={{ uri: imageUri }}
        className="w-full h-full"
        resizeMode="contain"
        style={{ opacity: 0.9 }}
      />

      {/* ── Bounding box đỏ cho frame được chọn ───────────────── */}
      {selectedFrame && (
        <Animated.View
          style={{
            position: 'absolute',
            left: `${selectedFrame.x}%`,
            top: `${selectedFrame.y}%`,
            width: `${selectedFrame.width}%`,
            height: `${selectedFrame.height}%`,
            opacity: frameOpacity,
            transform: [{ scale: frameScale }],
          }}
        >
          {/* Viền đỏ */}
          <View
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: '#EF4444',
              borderRadius: 4,
              backgroundColor: 'rgba(239,68,68,0.12)',
            }}
          />

          {/* Label tên frame — top-left của box */}
          <View
            style={{
              position: 'absolute',
              top: -22,
              left: 0,
              backgroundColor: '#EF4444',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <MaterialIcon name="frame_person" color="#fff" size={10} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
              {selectedFrame.name}
            </Text>
          </View>

          {/* 4 góc highlight */}
          {[
            { top: -1, left: -1 },
            { top: -1, right: -1 },
            { bottom: -1, left: -1 },
            { bottom: -1, right: -1 },
          ].map((pos, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                borderColor: '#EF4444',
                borderTopWidth: i < 2 ? 3 : 0,
                borderBottomWidth: i >= 2 ? 3 : 0,
                borderLeftWidth: i % 2 === 0 ? 3 : 0,
                borderRightWidth: i % 2 === 1 ? 3 : 0,
                ...pos,
              }}
            />
          ))}
        </Animated.View>
      )}

      {/* ── Status badge — top right, pulsing ──────────────────── */}
      <Animated.View
        className="absolute top-4 right-4"
        style={{ opacity: pulse }}
      >
        <View
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: Colors.statusReview }}
        >
          <MaterialIcon name="visibility" color={Colors.bg} size={14} />
          <Text
            className="text-[11px] font-bold uppercase tracking-tight"
            style={{ color: Colors.bg }}
          >
            {status}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
