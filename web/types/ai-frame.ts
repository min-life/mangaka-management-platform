export type AiFrameRegion = {
  endX: number;
  endY: number;
  startX: number;
  startY: number;
};

export type AiFrameDetectRequest = {
  imageUrl: string;
  objectName: string;
};

export type AiFrameDetectResponse = {
  confidence?: number;
  found: boolean;
  message?: string;
  region?: AiFrameRegion;
};
