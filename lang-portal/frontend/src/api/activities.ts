import { fetchApi, ApiError } from './config';
import { API_ENDPOINTS } from './constants';
import type { Activity, ActivityStats, ActivityProgress, ActivityType } from '../types/activities';

const defaultActivityStats = {
  total_activities: 0,
  completed_activities: 0,
  in_progress_activities: 0,
  success_rate: 0
};

export const activitiesApi = {
  // Get all activities
  getActivities: async (): Promise<Activity[]> => {
    try {
      return await fetchApi<Activity[]>(API_ENDPOINTS.ACTIVITIES.LIST);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get a single activity
  getActivity: async (id: number): Promise<Activity> => {
    return await fetchApi<Activity>(API_ENDPOINTS.ACTIVITIES.DETAIL(id));
  },

  // Create a new activity
  createActivity: async (data: Omit<Activity, 'id'>): Promise<Activity> => {
    return await fetchApi<Activity>(API_ENDPOINTS.ACTIVITIES.LIST, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update an activity
  updateActivity: async (id: number, data: Partial<Activity>): Promise<Activity> => {
    return await fetchApi<Activity>(API_ENDPOINTS.ACTIVITIES.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete an activity
  deleteActivity: async (id: number): Promise<void> => {
    await fetchApi(API_ENDPOINTS.ACTIVITIES.DETAIL(id), {
      method: 'DELETE'
    });
  },

  // Start an activity
  startActivity: async (id: number): Promise<Activity> => {
    return await fetchApi<Activity>(API_ENDPOINTS.ACTIVITIES.START(id), {
      method: 'POST'
    });
  },

  // Get activity progress
  getActivityProgress: async (id: number): Promise<ActivityProgress> => {
    try {
      return await fetchApi<ActivityProgress>(`${API_ENDPOINTS.ACTIVITIES.DETAIL(id)}/progress`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return {
          completed_steps: 0,
          total_steps: 0,
          current_step: 0,
          success_rate: 0
        };
      }
      throw error;
    }
  },

  // Get activity statistics
  getActivityStats: async () => {
    try {
      return await fetchApi<typeof defaultActivityStats>(`${API_ENDPOINTS.ACTIVITIES.LIST}/stats`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return defaultActivityStats;
      }
      throw error;
    }
  },

  // Get activity types
  getActivityTypes: async (): Promise<ActivityType[]> => {
    try {
      return await fetchApi<ActivityType[]>(`${API_ENDPOINTS.ACTIVITIES.LIST}/types`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Submit activity step
  submitActivityStep: async (
    id: number,
    data: { step: number; answer: any; time_spent: number }
  ): Promise<ActivityProgress> => {
    return await fetchApi<ActivityProgress>(`${API_ENDPOINTS.ACTIVITIES.DETAIL(id)}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Complete activity
  completeActivity: async (id: number): Promise<Activity> => {
    return await fetchApi<Activity>(`${API_ENDPOINTS.ACTIVITIES.DETAIL(id)}/complete`, {
      method: 'POST'
    });
  },

  // Get recent activity
  getRecentActivity: () =>
    fetchApi<Activity[]>('activities/recent'),

  // Get activity history
  getActivityHistory: () =>
    fetchApi<Activity[]>('activities/history'),

  // Get practice stats
  getPracticeStats: () =>
    fetchApi<any>('activities/practice/stats'),
}; 