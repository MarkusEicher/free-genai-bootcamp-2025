import apiClient from './client';

interface DashboardStats {
  success_rate: number;
  study_sessions_count: number;
  active_activities_count: number;
  active_groups_count: number;
  study_streak: {
    current_streak: number;
    longest_streak: number;
  };
}

interface DashboardProgress {
  total_items: number;
  studied_items: number;
  mastered_items: number;
  progress_percentage: number;
}

interface LatestSession {
  activity_name: string;
  activity_type: string;
  practice_direction: string;
  group_count: number;
  start_time: string;
  end_time: string | null;
  success_rate: number;
  correct_count: number;
  incorrect_count: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/api/v1/dashboard/stats');
    return response.data;
  },

  getProgress: async (): Promise<DashboardProgress> => {
    const response = await apiClient.get<DashboardProgress>('/api/v1/dashboard/progress');
    return response.data;
  },

  getLatestSessions: async (limit: number = 5): Promise<LatestSession[]> => {
    const response = await apiClient.get<LatestSession[]>(`/api/v1/dashboard/latest-sessions`, {
      params: { limit },
    });
    return response.data;
  },
};

// Export types for use in components
export type { DashboardStats, DashboardProgress, LatestSession };