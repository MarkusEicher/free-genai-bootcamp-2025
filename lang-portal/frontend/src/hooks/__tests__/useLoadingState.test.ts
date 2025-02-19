import { renderHook, act } from '@testing-library/react-hooks';
import { useLoadingState } from '../useLoadingState';
import { ApiError } from '../../api/config';

describe('useLoadingState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useLoadingState());
    expect(result.current).toEqual({
      isLoading: false,
      error: null,
      data: null,
      execute: expect.any(Function),
      reset: expect.any(Function),
      setData: expect.any(Function)
    });
  });

  it('handles successful data loading', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockPromise = Promise.resolve(mockData);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useLoadingState({ onSuccess }));

    await act(async () => {
      await result.current.execute(mockPromise);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it('handles loading state', async () => {
    const mockPromise = new Promise(resolve => setTimeout(resolve, 100));
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.execute(mockPromise);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors', async () => {
    const mockError = new ApiError('Not found', 404);
    const mockPromise = Promise.reject(mockError);
    const onError = jest.fn();

    const { result } = renderHook(() => useLoadingState({ onError }));

    await act(async () => {
      try {
        await result.current.execute(mockPromise);
      } catch (error) {
        // Error is expected
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('handles non-API errors', async () => {
    const mockError = new Error('Network error');
    const mockPromise = Promise.reject(mockError);
    const onError = jest.fn();

    const { result } = renderHook(() => useLoadingState({ onError }));

    await act(async () => {
      try {
        await result.current.execute(mockPromise);
      } catch (error) {
        // Error is expected
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.data).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('resets state correctly', () => {
    const initialData = { id: 1 };
    const { result } = renderHook(() => useLoadingState({ initialData }));

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(initialData);
  });

  it('updates data with setData', () => {
    const newData = { id: 2 };
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setData(newData);
    });

    expect(result.current.data).toEqual(newData);
  });
}); 