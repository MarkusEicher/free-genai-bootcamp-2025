import { useState, useEffect, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';
import { useLoadingState } from './useLoadingState';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000,    // 10 seconds
  backoffFactor: 2
};

interface CacheableQueryOptions<T> {
  cacheKey: string;
  cacheDuration?: number;
  queryFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

export function useCacheableQuery<T>({
  cacheKey,
  cacheDuration = 5 * 60 * 1000, // 5 minutes default
  queryFn,
  onSuccess,
  onError,
  enabled = true,
  retryConfig = {}
}: CacheableQueryOptions<T>) {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const { getCacheItem, setCacheItem } = useCache();
  const [isCacheHit, setIsCacheHit] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{ timestamp: number; expires: number } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  const { isLoading, error, data, execute, reset, setData } = useLoadingState<T>({
    onSuccess: (data) => {
      setRetryCount(0);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    }
  });

  // Cleanup function for retries
  const cleanupRetry = useCallback(() => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
  }, [retryTimeout]);

  // Calculate delay for next retry
  const getRetryDelay = useCallback((attempt: number) => {
    const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
    return Math.min(delay, config.maxDelay);
  }, [config]);

  const fetchWithRetry = useCallback(async (attempt: number = 0): Promise<T> => {
    try {
      return await queryFn();
    } catch (error) {
      if (attempt < config.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.warn(`Retry attempt ${attempt + 1} of ${config.maxRetries} after ${delay}ms`);
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(async () => {
            try {
              const result = await fetchWithRetry(attempt + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
          setRetryTimeout(timeout);
        });
      }
      throw error;
    }
  }, [queryFn, config.maxRetries, getRetryDelay]);

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cachedData = await getCacheItem(cacheKey);
      
      if (cachedData) {
        setIsCacheHit(true);
        setCacheStatus({
          timestamp: cachedData.cacheInfo.timestamp,
          expires: cachedData.cacheInfo.expires
        });
        setData(cachedData.data);
        return;
      }

      // If no cache or expired, fetch fresh data with retry logic
      const freshData = await execute(fetchWithRetry());
      
      // Store in cache
      await setCacheItem(cacheKey, freshData, Date.now() + cacheDuration);
      
      setIsCacheHit(false);
      setCacheStatus({
        timestamp: Date.now(),
        expires: Date.now() + cacheDuration
      });
    } catch (error) {
      console.error('Cache query error:', error);
      setRetryCount(prev => prev + 1);
      // Let the loading state handle the error
    }
  }, [cacheKey, cacheDuration, queryFn, getCacheItem, setCacheItem, execute, setData, fetchWithRetry]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
    return () => {
      cleanupRetry();
    };
  }, [enabled, fetchData, cleanupRetry]);

  const refetch = useCallback(async () => {
    cleanupRetry();
    setRetryCount(0);
    setIsCacheHit(false);
    setCacheStatus(null);
    return fetchData();
  }, [fetchData, cleanupRetry]);

  return {
    isLoading,
    error,
    data,
    refetch,
    reset,
    isCacheHit,
    cacheStatus,
    retryCount,
    execute: fetchData
  };
} 