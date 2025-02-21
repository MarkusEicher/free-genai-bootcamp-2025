import { useState, useEffect, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';
import { useLoadingState } from './useLoadingState';

interface CacheableQueryOptions<T> {
  cacheKey: string;
  cacheDuration?: number;
  queryFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useCacheableQuery<T>({
  cacheKey,
  cacheDuration = 5 * 60 * 1000, // 5 minutes default
  queryFn,
  onSuccess,
  onError,
  enabled = true
}: CacheableQueryOptions<T>) {
  const { getCacheItem, setCacheItem, getCacheStatus } = useCache();
  const [isCacheHit, setIsCacheHit] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{ timestamp: number; expires: number } | null>(null);

  const { isLoading, error, data, execute, reset, setData } = useLoadingState<T>({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    }
  });

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

      // If no cache or expired, fetch fresh data
      const freshData = await execute(queryFn());
      
      // Store in cache
      await setCacheItem(cacheKey, freshData, Date.now() + cacheDuration);
      
      setIsCacheHit(false);
      setCacheStatus({
        timestamp: Date.now(),
        expires: Date.now() + cacheDuration
      });
    } catch (error) {
      console.error('Cache query error:', error);
      // Let the loading state handle the error
    }
  }, [cacheKey, cacheDuration, queryFn, getCacheItem, setCacheItem, execute, setData]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  const refetch = useCallback(async () => {
    setIsCacheHit(false);
    setCacheStatus(null);
    return fetchData();
  }, [fetchData]);

  return {
    isLoading,
    error,
    data,
    refetch,
    reset,
    isCacheHit,
    cacheStatus,
    execute: fetchData
  };
} 