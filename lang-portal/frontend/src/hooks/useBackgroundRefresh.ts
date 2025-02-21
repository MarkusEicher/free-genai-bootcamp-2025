import { useEffect, useRef, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';

interface BackgroundRefreshOptions {
  key: string;
  queryFn: () => Promise<any>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  minInterval?: number;
  maxInterval?: number;
  shouldRefresh?: (lastUpdate: number) => boolean;
}

export function useBackgroundRefresh({
  key,
  queryFn,
  interval = 30000, // Default 30 seconds
  enabled = true,
  onSuccess,
  onError,
  minInterval = 5000, // Minimum 5 seconds
  maxInterval = 300000, // Maximum 5 minutes
  shouldRefresh
}: BackgroundRefreshOptions) {
  const { getCacheStatus, setCacheItem } = useCache();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(Date.now());
  const attemptsRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      // Check if we should refresh based on custom logic
      if (shouldRefresh) {
        const shouldProceed = await shouldRefresh(lastUpdateRef.current);
        if (!shouldProceed) return;
      }

      // Check cache status
      const status = await getCacheStatus(key);
      if (status && status.expires > Date.now()) {
        // Cache is still valid, adjust next check based on expiration
        const nextCheck = Math.min(
          status.expires - Date.now(),
          maxInterval
        );
        timeoutRef.current = setTimeout(refresh, nextCheck);
        return;
      }

      // Fetch fresh data
      const data = await queryFn();
      
      // Update cache with new data
      await setCacheItem(key, data, Date.now() + interval);
      
      // Reset attempts on success
      attemptsRef.current = 0;
      lastUpdateRef.current = Date.now();
      
      onSuccess?.(data);

      // Schedule next refresh
      timeoutRef.current = setTimeout(refresh, interval);
    } catch (error) {
      // Implement exponential backoff
      attemptsRef.current += 1;
      const backoffTime = Math.min(
        maxInterval,
        Math.max(
          minInterval,
          interval * Math.pow(2, attemptsRef.current - 1)
        )
      );

      console.warn(`Background refresh failed for ${key}. Retrying in ${backoffTime}ms`, error);
      onError?.(error instanceof Error ? error : new Error('Background refresh failed'));
      
      // Schedule retry
      timeoutRef.current = setTimeout(refresh, backoffTime);
    }
  }, [
    key,
    queryFn,
    interval,
    enabled,
    onSuccess,
    onError,
    minInterval,
    maxInterval,
    shouldRefresh,
    getCacheStatus,
    setCacheItem
  ]);

  useEffect(() => {
    if (!enabled) return;

    // Initial refresh
    refresh();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, refresh]);

  return {
    refresh,
    lastUpdate: lastUpdateRef.current,
    attempts: attemptsRef.current
  };
} 