import { useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';
import { dashboardApi } from '../api/dashboard';

interface DashboardCacheOptions {
  onError?: (error: Error) => void;
}

export function useDashboardCache({
  onError
}: DashboardCacheOptions = {}) {
  const { getCacheItem, setCacheItem } = useCache();

  const fetchStats = useCallback(async (force = false) => {
    try {
      // Check cache first unless force refresh is requested
      if (!force) {
        const cached = await getCacheItem('dashboard-stats');
        if (cached?.data) {
          return cached.data;
        }
      }

      // If no cache or force refresh, fetch new data
      const data = await dashboardApi.getDashboardStats();
      await setCacheItem('dashboard-stats', data, Date.now() + 3600000); // 1 hour cache
      return data;
    } catch (error) {
      console.warn('Failed to fetch dashboard stats:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to fetch stats'));
      // Return cached data if available, even if expired
      const cached = await getCacheItem('dashboard-stats');
      return cached?.data;
    }
  }, [getCacheItem, setCacheItem, onError]);

  const fetchProgress = useCallback(async (force = false) => {
    try {
      // Check cache first unless force refresh is requested
      if (!force) {
        const cached = await getCacheItem('dashboard-progress');
        if (cached?.data) {
          return cached.data;
        }
      }

      // If no cache or force refresh, fetch new data
      const data = await dashboardApi.getDashboardProgress();
      await setCacheItem('dashboard-progress', data, Date.now() + 3600000); // 1 hour cache
      return data;
    } catch (error) {
      console.warn('Failed to fetch dashboard progress:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to fetch progress'));
      // Return cached data if available, even if expired
      const cached = await getCacheItem('dashboard-progress');
      return cached?.data;
    }
  }, [getCacheItem, setCacheItem, onError]);

  return {
    fetchStats,
    fetchProgress,
    refreshAll: async () => {
      await Promise.allSettled([
        fetchStats(true),
        fetchProgress(true)
      ]);
    }
  };
} 