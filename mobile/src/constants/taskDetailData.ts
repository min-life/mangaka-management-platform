import { Contributor, Comment, FrameAnnotation } from '@/src/types/taskDetail';

/**
 * Data tĩnh cho màn hình Task Detail & Review
 */

export const TASK_INFO = {
  chapter: 'Chapter 4',
  pageCode: 'C04_P45',
  status: 'In Review' as const,
  reviewProgress: 75,
  description:
    'This task involves the final review of Chapter 4, Page 45. Focus on screentone density in panel 3 and verify all speech bubble text for typos before final export.',
  previewImageUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBa6Ra23Ev0XiF9ENBLsttEOyR9gN263CzalsJPQAtQRxN1xqQ9GSf0L3_ti8Y1cRa_SHs2YqRXECkgDQo8UQSmFKBNWPKAYYwYtRdwtP0p5bFdopgW-NhM0DHkv8jLy8VtAkvNifSWSavdjnZ73tucI_Uk7NkKmQoM-xeEbLsBWm4DVzk7LoDxX5HpQJyrdTL2Nuby9ZPdb1C-IVp4d-KobGbVW8VGv0SCw3F8S6UdEYRrwVINqO40FUZdb77AWrCPzpAXa5gbpJ3P',
};

/**
 * FRAMES — Các vùng annotation trên trang manga.
 * Tọa độ x, y, width, height tính theo % so với container ảnh (0–100).
 */
export const FRAMES: FrameAnnotation[] = [
  {
    id: 'frame-1',
    name: 'Tô viền nhân vật',
    description: 'Panel 1 — nhân vật chính, cần tô viền dày hơn',
    x: 5,
    y: 3,
    width: 55,
    height: 30,
  },
  {
    id: 'frame-2',
    name: 'Screentone Panel 3',
    description: 'Panel 3 — mật độ screentone quá dày, giảm xuống 10%',
    x: 5,
    y: 36,
    width: 88,
    height: 28,
  },
  {
    id: 'frame-3',
    name: 'Speech bubble typo',
    description: 'Panel 4 — bong bóng thoại cần kiểm tra chính tả',
    x: 55,
    y: 3,
    width: 40,
    height: 20,
  },
  {
    id: 'frame-4',
    name: 'Background ink',
    description: 'Panel cuối — nền cityscape thiếu chi tiết cross-hatch',
    x: 5,
    y: 67,
    width: 88,
    height: 28,
  },
];

export const CONTRIBUTORS: Contributor[] = [
  {
    id: '1',
    initials: 'KY',
    name: 'Kaito Yamamoto',
    role: 'Lead Artist',
    verified: true,
    bgColor: 'rgba(255,243,225,0.15)',
    textColor: '#ffdf98',
  },
  {
    id: '2',
    initials: 'RE',
    name: 'Ren Editor',
    role: 'Content Editor',
    bgColor: 'rgba(194,199,208,0.15)',
    textColor: '#c2c7d0',
  },
];

export const COMMENTS: Comment[] = [
  {
    id: 'c1',
    frameId: 'frame-1',
    initials: 'KY',
    author: 'Kaito Yamamoto',
    authorRole: 'LEAD ARTIST',
    time: '2 hours ago',
    body: 'Đường viền nhân vật ở panel này cần dày hơn khoảng 0.5px. ',
    mention: '@Ren_Editor',
  },
  {
    id: 'c2',
    frameId: 'frame-1',
    initials: 'RE',
    author: 'Ren Editor',
    authorRole: 'CONTENT EDITOR',
    time: '1 hour ago',
    body: 'Đồng ý, sẽ điều chỉnh sau khi xong screentone.',
  },
  {
    id: 'c3',
    frameId: 'frame-2',
    initials: 'KY',
    author: 'Kaito Yamamoto',
    authorRole: 'LEAD ARTIST',
    time: '2 hours ago',
    body: 'Screentone trên panel 3 quá dày cho ánh sáng hiện tại. Giảm xuống 10% density? ',
    mention: '@Ren_Editor',
  },
  {
    id: 'c4',
    frameId: 'frame-3',
    initials: 'RE',
    author: 'Ren Editor',
    authorRole: 'CONTENT EDITOR',
    time: '3 hours ago',
    body: 'Speech bubble ở panel 4: "彼はどこだ" — cần kiểm tra lại bản dịch tiếng Anh.',
  },
  {
    id: 'c5',
    frameId: 'frame-4',
    initials: 'KY',
    author: 'Kaito Yamamoto',
    authorRole: 'LEAD ARTIST',
    time: '5 hours ago',
    body: 'Nền cityscape thiếu cross-hatch ở góc phải. Cần bổ sung thêm texture trước khi export.',
  },
];
