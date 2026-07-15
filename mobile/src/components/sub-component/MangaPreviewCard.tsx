import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  ImageLoadEventData,
  LayoutChangeEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { FrameAnnotation } from '@/src/types/taskDetail';
import MaterialIcon from '@/src/components/shared/MaterialIcon';

interface MangaPreviewCardProps {
  imageUri?: string;
  status: string;
  selectedFrame?: FrameAnnotation | null;
  showStatusBadge?: boolean;
}

const WEB_CANVAS_ASPECT_RATIO = 16 / 10;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

function normalizeRegion(frame: FrameAnnotation) {
  const startX = Number.isFinite(frame.startX) ? Number(frame.startX) : frame.x;
  const startY = Number.isFinite(frame.startY) ? Number(frame.startY) : frame.y;
  const endX = Number.isFinite(frame.endX) ? Number(frame.endX) : frame.x + frame.width;
  const endY = Number.isFinite(frame.endY) ? Number(frame.endY) : frame.y + frame.height;
  const rawValues = [startX, startY, endX, endY];
  const valuesAreFinite = rawValues.every(Number.isFinite);

  if (!valuesAreFinite || endX <= startX || endY <= startY) {
    return null;
  }

  const maxAbs = Math.max(...rawValues.map((value) => Math.abs(value)));
  const scale = maxAbs <= 1.5 ? 1 : 1 / 100;
  const left = clamp01(startX * scale);
  const top = clamp01(startY * scale);
  const right = clamp01(endX * scale);
  const bottom = clamp01(endY * scale);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    bottom,
    left,
    right,
    top,
  };
}

function containedImageRect(
  canvas: { height: number; width: number },
  image: { height: number; width: number } | null,
) {
  if (!image || image.width <= 0 || image.height <= 0 || canvas.width <= 0 || canvas.height <= 0) {
    return { height: canvas.height, left: 0, top: 0, width: canvas.width };
  }

  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  return {
    height,
    left: (canvas.width - width) / 2,
    top: (canvas.height - height) / 2,
    width,
  };
}

function webCanvasRegionToImageRegion(
  region: NonNullable<ReturnType<typeof normalizeRegion>>,
  image: { height: number; width: number },
) {
  const canonicalCanvas = { height: 1, width: WEB_CANVAS_ASPECT_RATIO };
  const canonicalImageRect = containedImageRect(canonicalCanvas, image);

  const toImageX = (x: number) =>
    clamp01((x * canonicalCanvas.width - canonicalImageRect.left) / canonicalImageRect.width);
  const toImageY = (y: number) =>
    clamp01((y * canonicalCanvas.height - canonicalImageRect.top) / canonicalImageRect.height);

  return {
    bottom: toImageY(region.bottom),
    left: toImageX(region.left),
    right: toImageX(region.right),
    top: toImageY(region.top),
  };
}

function frameRenderBox(
  frame: FrameAnnotation,
  canvas: { height: number; width: number },
  image: { height: number; width: number } | null,
) {
  const region = normalizeRegion(frame);

  if (!region) return null;

  const imageRegion = image ? webCanvasRegionToImageRegion(region, image) : region;
  const imageRect = containedImageRect(canvas, image);

  const left = clampPercent(((imageRect.left + imageRegion.left * imageRect.width) / canvas.width) * 100);
  const top = clampPercent(((imageRect.top + imageRegion.top * imageRect.height) / canvas.height) * 100);
  const right = clampPercent(((imageRect.left + imageRegion.right * imageRect.width) / canvas.width) * 100);
  const bottom = clampPercent(((imageRect.top + imageRegion.bottom * imageRect.height) / canvas.height) * 100);
  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    height: Math.max(height, 1.5),
    left,
    top,
    width: Math.max(width, 1.5),
  };
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
  showStatusBadge = true,
}: MangaPreviewCardProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const frameOpacity = useRef(new Animated.Value(0)).current;
  const frameScale = useRef(new Animated.Value(1.08)).current;
  const [canvasSize, setCanvasSize] = useState({ height: 0, width: 0 });
  const [imageSize, setImageSize] = useState<{ height: number; width: number } | null>(null);
  const selectedFrameBox = useMemo(
    () => (selectedFrame && canvasSize.width > 0 && canvasSize.height > 0
      ? frameRenderBox(selectedFrame, canvasSize, imageSize)
      : null),
    [canvasSize, imageSize, selectedFrame],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setCanvasSize({ height, width });
  };

  const handleImageLoad = (event: NativeSyntheticEvent<ImageLoadEventData>) => {
    const { height, width } = event.nativeEvent.source;

    if (width > 0 && height > 0) {
      setImageSize({ height, width });
    }
  };

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
      onLayout={handleLayout}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="w-full h-full"
          onLoad={handleImageLoad}
          resizeMode="contain"
          style={{ opacity: 0.9 }}
        />
      ) : (
        <View className="h-full w-full items-center justify-center gap-3">
          <MaterialIcon name="image" color={Colors.textFaint} size={36} />
          <Text className="text-[13px] font-semibold" style={{ color: Colors.textMuted }}>
            No preview image
          </Text>
        </View>
      )}

      {/* ── Bounding box đỏ cho frame được chọn ───────────────── */}
      {selectedFrame && selectedFrameBox && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${selectedFrameBox.left}%`,
            top: `${selectedFrameBox.top}%`,
            width: `${selectedFrameBox.width}%`,
            height: `${selectedFrameBox.height}%`,
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

      {showStatusBadge && (
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
      )}
    </View>
  );
}
