import { useState, useCallback } from 'react';
import { ApiError } from '../api/config';

interface UseLoadingStateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

interface LoadingState<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
}

export function useLoadingState<T>(options: UseLoadingStateOptions<T> = {}) {
  const [state, setState] = useState<LoadingState<T>>({
    isLoading: false,
    error: null,
    data: options.initialData || null
  });

  const execute = useCallback(
    async (promise: Promise<T>) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await promise;
        setState({ isLoading: false, error: null, data });
        options.onSuccess?.(data);
        return data;
      } catch (error) {
        const apiError = error instanceof ApiError
          ? error
          : new ApiError(
              'An unexpected error occurred',
              500,
              error instanceof Error ? error.message : 'Unknown error'
            );

        setState({ isLoading: false, error: apiError, data: null });
        options.onError?.(apiError);
        throw apiError;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: options.initialData || null
    });
  }, [options.initialData]);

  return {
    ...state,
    execute,
    reset,
    setData: (data: T) => setState(prev => ({ ...prev, data }))
  };
}

// Example usage:
/*
const MyComponent = () => {
  const { isLoading, error, data, execute } = useLoadingState<UserData>({
    onSuccess: (data) => {
      console.log('Data loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading data:', error);
    }
  });

  useEffect(() => {
    execute(api.getUserData());
  }, [execute]);

  if (isLoading) return <LoadingState />;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
};
*/ 