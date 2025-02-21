import { fetchApi, ApiError } from './config';
import { API_ENDPOINTS } from './constants';
import type { DashboardStats, DashboardProgress, LatestSession } from '../types/dashboard';

const defaultStats: DashboardStats = {
  success_rate: 0,
  study_sessions_count: 0,
  active_activities_count: 0,
  active_groups_count: 0,
  study_streak: {
    current_streak: 0,
    longest_streak: 0
  }
};

const defaultProgress: DashboardProgress = {
  total_items: 0,
  studied_items: 0,
  mastered_items: 0,
  progress_percentage: 0
};

export const dashboardApi = {
  // Core dashboard endpoints
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await fetchApi<DashboardStats>(API_ENDPOINTS.DASHBOARD.STATS);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return defaultStats;
      }
      throw error;
    }
  },

  getDashboardProgress: async (): Promise<DashboardProgress> => {
    try {
      const response = await fetchApi<DashboardProgress>(API_ENDPOINTS.DASHBOARD.PROGRESS);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return defaultProgress;
      }
      throw error;
    }
  },

  getLatestSessions: async (limit: number = 5): Promise<LatestSession[]> => {
    try {
      const response = await fetchApi<LatestSession[]>(API_ENDPOINTS.DASHBOARD.LATEST_SESSIONS, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Remove endpoints that might expose sensitive data
  // getPerformanceHistory, getUserStats, getUserAchievements removed

  // Simplified dashboard data endpoint
  getDashboardData: async (sessionsLimit: number = 5) => {
    try {
      const [stats, progress, latestSessions] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getDashboardProgress(),
        dashboardApi.getLatestSessions(sessionsLimit)
      ]);

      return {
        stats,
        progress,
        latestSessions
      };
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      return {
        stats: defaultStats,
        progress: defaultProgress,
        latestSessions: []
      };
    }
  }
};