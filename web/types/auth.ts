// AuthStatus giúp FE phân biệt rõ 3 giai đoạn:
// loading: đang kiểm tra session, authenticated: được vào app, unauthenticated: về login.
// AuthStatus giúp FE phân biệt rõ trạng thái auth hiện tại.
// loading: đang kiểm tra session, authenticated: được vào app,
// unauthenticated: về login, error: lỗi server/network khi verify session.
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

// Event này giúp api.ts báo cho React auth state biết session đã hết hạn.
// Vì axios interceptor nằm ngoài React nên không gọi AuthContext trực tiếp được.
export const AUTH_LOGOUT_EVENT = 'auth:logout';

// Dữ liệu user lấy từ GET /users/me.
// role và permissions để optional để sau này mở rộng RBAC mà không phải đổi cấu trúc lớn.
export type AuthUser = {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  permissions?: string[];
};

// Giá trị AuthProvider chia sẻ cho toàn bộ protected pages qua useAuth().
export type AuthContextType = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  refreshUser: () => Promise<void>;
  // Patches the cached user in place (e.g. after a profile/avatar edit) without
  // flipping status back to 'loading', so AuthWrapper doesn't unmount protected pages.
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
};
