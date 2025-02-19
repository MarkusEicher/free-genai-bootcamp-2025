import { fetchApi } from './config';
import type { UserProfile, UpdateProfileData } from '../types/profile';

export const profileApi = {
  // Get user profile
  getProfile: () =>
    fetchApi<UserProfile>('profile'),

  // Update user profile
  updateProfile: (data: UpdateProfileData) =>
    fetchApi<UserProfile>('profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get profile settings
  getSettings: () =>
    fetchApi<any>('profile/settings'),

  // Update profile settings
  updateSettings: (settings: any) =>
    fetchApi<void>('profile/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Get profile preferences
  getPreferences: () =>
    fetchApi<any>('profile/preferences'),

  // Update profile preferences
  updatePreferences: (preferences: any) =>
    fetchApi<void>('profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  // Get profile achievements
  getAchievements: () =>
    fetchApi<any>('profile/achievements'),

  // Claim achievement reward
  claimReward: (achievementId: number) =>
    fetchApi<void>(`profile/achievements/${achievementId}/claim`, {
      method: 'POST',
    }),

  // Get profile stats
  getStats: () =>
    fetchApi<any>('profile/stats'),

  // Update profile stats
  updateStats: (stats: any) =>
    fetchApi<void>('profile/stats', {
      method: 'PUT',
      body: JSON.stringify(stats),
    }),
}; 