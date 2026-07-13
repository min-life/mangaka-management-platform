/**
 * Types cho màn hình Task Detail & Review
 */

export type ReviewTab = 'Overview' | 'Discussion' | 'Action';

/** Tọa độ bounding box trên ảnh, tính theo % so với chiều rộng/cao của ảnh */
export interface FrameAnnotation {
  id: string;
  materialId?: string;
  name: string; // Tên frame, ví dụ: "Tô viền nhân vật"
  description?: string;
  /** Vị trí và kích thước: 0–100 (% của container ảnh) */
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
