import { fetchApi } from './config';
import type { Activity, ActivityStats, ActivityProgress } from '../types/activities';

export const activitiesApi = {
  // Get all activities
  getActivities: () => 
    fetchApi<Activity[]>('activities'),

  // Get a single activity
  getActivity: (id: number) =>
    fetchApi<Activity>(`activities/${id}`),

  // Create a new activity
  createActivity: (activityData: Omit<Activity, 'id'>) =>
    fetchApi<Activity>('activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    }),

  // Update an activity
  updateActivity: (activity: Activity) =>
    fetchApi<Activity>(`activities/${activity.id}`, {
      method: 'PUT',
      body: JSON.stringify(activity),
    }),

  // Delete an activity
  deleteActivity: (id: number) =>
    fetchApi<void>(`activities/${id}`, {
      method: 'DELETE',
    }),

  // Start an activity
  startActivity: (activityId: number) =>
    fetchApi<Activity>(`activities/${activityId}/start`, {
      method: 'POST',
    }),

  // Get activity progress
  getActivityProgress: (activityId: number) =>
    fetchApi<ActivityProgress>(`activities/${activityId}/progress`),

  // Submit activity answer
  submitAnswer: (activityId: number, data: { step: number; answer: string }) =>
    fetchApi<void>(`activities/${activityId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get activity statistics
  getActivityStats: () =>
    fetchApi<ActivityStats>('activities/stats'),

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