export type CanvasImageMetrics = {
  imageUrl?: string;
  naturalHeight: number;
  naturalWidth: number;
};

export type CanvasSize = {
  height: number;
  width: number;
};

export type CanvasImageRect = CanvasSize & {
  left: number;
  top: number;
};

export type NormalizedFrameRegion = {
  endX: number;
  endY: number;
  startX: number;
  startY: number;
};

export function getContainedImageRect(
  canvas: CanvasSize,
  image: CanvasImageMetrics | null,
): CanvasImageRect {
  const width = Math.max(0, canvas.width);
  const height = Math.max(0, canvas.height);

  if (
    !image ||
    !Number.isFinite(image.naturalWidth) ||
    !Number.isFinite(image.naturalHeight) ||
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0 ||
    width === 0 ||
    height === 0
  ) {
    return { height, left: 0, top: 0, width };
  }

  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;

  return {
    height: imageHeight,
    left: (width - imageWidth) / 2,
    top: (height - imageHeight) / 2,
    width: imageWidth,
  };
}

export function mapImageRegionToCanvas(
  region: NormalizedFrameRegion,
  imageRect: CanvasImageRect,
  canvas: CanvasSize,
): NormalizedFrameRegion {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));

  if (canvas.width === 0 || canvas.height === 0) {
    return {
      endX: clamp(region.endX),
      endY: clamp(region.endY),
      startX: clamp(region.startX),
      startY: clamp(region.startY),
    };
  }

  return {
    endX: clamp((imageRect.left + region.endX * imageRect.width) / canvas.width),
    endY: clamp((imageRect.top + region.endY * imageRect.height) / canvas.height),
    startX: clamp((imageRect.left + region.startX * imageRect.width) / canvas.width),
    startY: clamp((imageRect.top + region.startY * imageRect.height) / canvas.height),
  };
}
