/**
 * Types cho màn hình Task Detail & Review
 */

export type ReviewTab = 'Overview' | 'Discussion' | 'Action';

/** Tọa độ bounding box trên canvas ảnh. API/web hiện lưu dạng normalized 0–1. */
export interface FrameAnnotation {
  id: string;
  materialId?: string;
  name: string; // Tên frame, ví dụ: "Tô viền nhân vật"
  description?: string;
  /** Vị trí và kích thước: normalized 0–1, hoặc legacy 0–100 nếu có dữ liệu cũ. */
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Contributor {
  id: string;
  initials: string;
  name: string;
  role: string;
  verified?: boolean;
  bgColor: string;
  textColor: string;
}

export interface Comment {
  id: string;
  frameId: string; // Thuộc frame nào
  frameName?: string;
  materialFileId?: string;
  materialId?: string;
  materialName?: string;
  initials: string;
  author: string;
  authorRole: string;
  time: string;
  body: string;
  mention?: string;
}
