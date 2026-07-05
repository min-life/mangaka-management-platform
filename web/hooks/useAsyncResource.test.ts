import { renderHook, act } from '@testing-library/react';
import { useAsyncResource } from './useAsyncResource';

describe('useAsyncResource Hook Unit Tests', () => {
  // Test Case 1: Initial Load thành công
  it('should handle successful initial load correctly', async () => {
    const mockData = { id: 1, name: 'Project A' };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsyncResource(mockFetcher));

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.data).toBeNull();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  // Test Case 2: Initial Load thất bại (có setError)
  it('should set error state on initial load failure', async () => {
    const mockError = new Error('Connection failed');
    const mockFetcher = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useAsyncResource(mockFetcher));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Connection failed');
  });

  // Test Case 3: Reload thành công (gán isRefreshing)
  it('should handle successful reload correctly', async () => {
    const mockData1 = { id: 1, name: 'Project A' };
    const mockData2 = { id: 1, name: 'Project A Updated' };
    let toggle = false;
    const mockFetcher = jest.fn().mockImplementation(() => {
      const res = toggle ? mockData2 : mockData1;
      toggle = true;
      return Promise.resolve(res);
    });

    const { result } = renderHook(() => useAsyncResource(mockFetcher));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData1);

    // Call reload
    let reloadPromise: Promise<void>;
    act(() => {
      reloadPromise = result.current.reload();
    });

    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isInitialLoading).toBe(false);
    // Data cũ phải giữ nguyên khi đang refresh
    expect(result.current.data).toEqual(mockData1);

    await act(async () => {
      await reloadPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.data).toEqual(mockData2);
  });

  // Test Case 4: Reload thất bại (re-throw, không ghi đè data cũ, không ghi đè error state)
  it('should re-throw on reload failure and preserve previous data and clean error state', async () => {
    const mockData = { id: 1, name: 'Project A' };
    const mockError = new Error('Failed to update');
    let toggle = false;
    const mockFetcher = jest.fn().mockImplementation(() => {
      if (toggle) {
        return Promise.reject(mockError);
      }
      toggle = true;
      return Promise.resolve(mockData);
    });

    const { result } = renderHook(() => useAsyncResource(mockFetcher));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();

    // Call reload (should fail)
    let reloadPromise: Promise<void>;
    act(() => {
      reloadPromise = result.current.reload();
    });

    await expect(
      act(async () => {
        await reloadPromise;
      })
    ).rejects.toThrow('Failed to update');

    // Cần đảm bảo dữ liệu cũ vẫn được giữ nguyên
    expect(result.current.data).toEqual(mockData);
    // Không gán error state chặn trang
    expect(result.current.error).toBeNull();
    expect(result.current.isRefreshing).toBe(false);
  });

  // Test Case 5: Chống Race Condition (request cũ về sau request mới)
  it('should avoid race conditions where older requests overwrite newer requests data', async () => {
    let resolveFirst: (val: any) => void = () => {};
    let resolveSecond: (val: any) => void = () => {};

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    let count = 0;
    const mockFetcher = jest.fn().mockImplementation(() => {
      count++;
      return count === 1 ? firstPromise : secondPromise;
    });

    const { result } = renderHook(() => useAsyncResource(mockFetcher));

    // First request starts automatically
    // Now trigger reload (second request)
    let reloadPromise: Promise<void>;
    act(() => {
      reloadPromise = result.current.reload();
    });

    // Resolve second request first
    await act(async () => {
      resolveSecond({ val: 'second' });
      await reloadPromise;
    });

    expect(result.current.data).toEqual({ val: 'second' });

    // Resolve first request later (should be discarded)
    await act(async () => {
      resolveFirst({ val: 'first' });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Data must remain second
    expect(result.current.data).toEqual({ val: 'second' });
  });

  // Test Case 6: Hard Reset khi thay đổi deps
  it('should hard reset data to null and trigger initial loading when deps change', async () => {
    const mockData1 = { id: 1, name: 'Project A' };
    const mockData2 = { id: 2, name: 'Project B' };
    let currentProj = 1;
    const mockFetcher = jest.fn().mockImplementation(() => {
      return Promise.resolve(currentProj === 1 ? mockData1 : mockData2);
    });

    let depVal = 1;
    const { result, rerender } = renderHook(
      ({ dep }) => useAsyncResource(mockFetcher, [dep]),
      { initialProps: { dep: depVal } }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData1);

    // Change dep value
    depVal = 2;
    currentProj = 2;
    
    act(() => {
      rerender({ dep: depVal });
    });

    // Data must be immediately reset to null, and initial loading starts again
    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.data).toEqual(mockData2);
  });
});
