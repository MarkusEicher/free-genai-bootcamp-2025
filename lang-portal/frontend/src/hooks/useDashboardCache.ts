import { useEffect } from 'react';
import { useCache } from '../contexts/CacheContext';
import { useBackgroundRefresh } from './useBackgroundRefresh';
import { dashboardApi } from '../api/dashboard';

interface DashboardCacheOptions {
  enabled?: boolean;
  onWarmed?: () => void;
  onError?: (error: Error) => void;
}

export function useDashboardCache({
  enabled = true,
  onWarmed,
  onError
}: DashboardCacheOptions = {}) {
  const { setCacheItem, invalidateCache } = useCache();

  // Background refresh for latest sessions (more frequent updates)
  const latestSessions = useBackgroundRefresh({
    key: 'dashboard-latest-sessions',
    queryFn: () => dashboardApi.getLatestSessions(5),
    interval: 120000, // 2 minutes
    enabled,
    minInterval: 30000, // 30 seconds minimum
    maxInterval: 300000, // 5 minutes maximum
    shouldRefresh: async (lastUpdate) => {
      // Check if there's been any new session activity
      const sessions = await dashboardApi.getLatestSessions(1);
      return sessions[0]?.start_time > lastUpdate;
    },
    onError
  });

  // Background refresh for dashboard stats (less frequent updates)
  const stats = useBackgroundRefresh({
    key: 'dashboard-stats',
    queryFn: dashboardApi.getDashboardStats,
    interval: 300000, // 5 minutes
    enabled,
    onError
  });

  // Background refresh for progress data (medium frequency)
  const progress = useBackgroundRefresh({
    key: 'dashboard-progress',
    queryFn: dashboardApi.getDashboardProgress,
    interval: 180000, // 3 minutes
    enabled,
    onError
  });

  // Initial cache warming
  useEffect(() => {
    if (!enabled) return;

    const warmCache = async () => {
      try {
        // Fetch all dashboard data concurrently
        const [statsData, progressData, sessionsData] = await Promise.all([
          dashboardApi.getDashboardStats(),
          dashboardApi.getDashboardProgress(),
          dashboardApi.getLatestSessions(5)
        ]);

        // Cache the data with appropriate expiration times
        await Promise.all([
          setCacheItem('dashboard-stats', statsData, Date.now() + 300000),
          setCacheItem('dashboard-progress', progressData, Date.now() + 180000),
          setCacheItem('dashboard-latest-sessions', sessionsData, Date.now() + 120000)
        ]);

        onWarmed?.();
      } catch (error) {
        console.error('Failed to warm dashboard cache:', error);
        onError?.(error instanceof Error ? error : new Error('Cache warming failed'));
      }
    };

    warmCache();
  }, [enabled, setCacheItem, onWarmed, onError]);

  // Handle session completion
  const handleSessionComplete = async () => {
    // Invalidate all dashboard caches to ensure fresh data
    await invalidateCache('dashboard');
    
    // Trigger immediate refresh of all data
    await Promise.all([
      latestSessions.refresh(),
      stats.refresh(),
      progress.refresh()
    ]);
  };

  return {
    refreshAll: async () => {
      await Promise.all([
        latestSessions.refresh(),
        stats.refresh(),
        progress.refresh()
      ]);
    },
    refreshLatestSessions: latestSessions.refresh,
    refreshStats: stats.refresh,
    refreshProgress: progress.refresh,
    handleSessionComplete,
    lastUpdates: {
      latestSessions: latestSessions.lastUpdate,
      stats: stats.lastUpdate,
      progress: progress.lastUpdate
    }
  };
} 