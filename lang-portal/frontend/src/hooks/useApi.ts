import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import type { Goal } from '../types/goals'
import type { UserProfile, UpdateProfileData } from '../types/profile'
import { dashboardApi } from '../api/dashboard'
import { vocabularyApi } from '../api/vocabulary'
import { activitiesApi } from '../api/activities'
import { profileApi } from '../api/profile'
import { useLoadingState } from './useLoadingState'
import type { DashboardData } from '../types/dashboard'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      cacheTime: 0
    },
  },
});

// Profile hooks
export function useProfile() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile
  })

  const mutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  return {
    ...query,
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync
  }
}

// Achievement hooks
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: activitiesApi.getAchievements
  })
}

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: activitiesApi.getBadges
  })
}

// Vocabulary hooks
export function useVocabulary() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['vocabulary'],
    queryFn: vocabularyApi.getVocabulary
  })

  const mutation = useMutation({
    mutationFn: vocabularyApi.updateVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    }
  })

  return {
    ...query,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync
  }
}

// Activity hooks
export function useActivityStats() {
  return useQuery({
    queryKey: ['activity-stats'],
    queryFn: activitiesApi.getActivityStats
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: activitiesApi.getRecentActivity
  })
}

export function useActivityHistory() {
  return useQuery({
    queryKey: ['activity-history'],
    queryFn: activitiesApi.getActivityHistory
  })
}

export function usePracticeStats() {
  return useQuery({
    queryKey: ['practice-stats'],
    queryFn: activitiesApi.getPracticeStats
  })
}

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.getActivities
  })
}

export function useStartActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activitiesApi.startActivity,
    onSuccess: () => {
      // Invalidate both activities and activity-stats queries
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity-stats'] })
    }
  })
}

// Dashboard hooks
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => dashboardApi.getDashboardData(5)
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getDashboardStats
  });
}