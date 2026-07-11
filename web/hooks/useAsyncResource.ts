import { useState, useCallback, useEffect, useRef } from 'react';

export function useAsyncResource<T>(fetcher: () => Promise<T>, deps: any[] = [], softRefreshDeps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Tránh vòng lặp vô hạn: Dùng ref để giữ bản cập nhật của fetcher
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // 2. Tránh stale closure & theo dõi lượt tải đầu: Dùng ref đánh dấu đã từng tải thành công
  const hasLoadedRef = useRef(false);

  // 4. Chống race condition: Định danh cho từng lượt request
  const requestIdRef = useRef(0);

  // Chống memory leak khi component unmount giữa chừng
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    const currentId = ++requestIdRef.current;

    if (isRefresh) {
      setIsRefreshing(true);
    } else if (!hasLoadedRef.current) {
      setIsInitialLoading(true);
    }
    setError(null);

    try {
      const result = await fetcherRef.current();
      
      // Nếu có request mới hơn hoặc component đã unmount, bỏ qua kết quả
      if (!isMountedRef.current || requestIdRef.current !== currentId) {
        return;
      }
      
      setData(result);
      hasLoadedRef.current = true;
    } catch (err: any) {
      if (!isMountedRef.current || requestIdRef.current !== currentId) {
        return;
      }
      
      // Chỉ gán error state cho việc chặn màn hình nếu chưa có dữ liệu đầu tiên (Initial Load thất bại)
      if (!hasLoadedRef.current) {
        setError(err?.message || 'Failed to load resource');
      }
      
      // Lan truyền lỗi để component caller bắt lỗi và show toast.error
      throw err;
    } finally {
      if (isMountedRef.current && requestIdRef.current === currentId) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Reset khi đổi identity chính (projectId, fileId thay đổi) và bắt lỗi để tránh Unhandled Promise Rejection
  useEffect(() => {
    hasLoadedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    void load(false).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Soft refresh cho các dependency phụ (không gây trắng trang)
  useEffect(() => {
    if (hasLoadedRef.current) {
      void load(true).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, softRefreshDeps);

  return {
    data,
    setData,
    error,
    setError,
    isInitialLoading,
    isRefreshing,
    reload: useCallback(() => load(true), [load]),
  };
}
