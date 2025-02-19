import { fetchApi } from './config';
import type { DashboardStats, DashboardProgress, LatestSession } from '../types/dashboard';

export const dashboardApi = {
  // Core dashboard endpoints
  getDashboardStats: () =>
    fetchApi<DashboardStats>('dashboard/stats'),

  getDashboardProgress: () =>
    fetchApi<DashboardProgress>('dashboard/progress'),

  getLatestSessions: (limit: number = 5) =>
    fetchApi<LatestSession[]>(`dashboard/latest-sessions?limit=${limit}`),

  // Remove endpoints that might expose sensitive data
  // getPerformanceHistory, getUserStats, getUserAchievements removed

  // Simplified dashboard data endpoint
  getDashboardData: (sessionsLimit: number = 5) =>
    fetchApi<{
      stats: DashboardStats;
      progress: DashboardProgress;
      latestSessions: LatestSession[];
    }>(`dashboard?sessionsLimit=${sessionsLimit}`)
};