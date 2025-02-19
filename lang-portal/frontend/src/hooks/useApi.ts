import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import type { Goal } from '../types/goals'
import type { UserProfile, UpdateProfileData } from '../types/profile'
import { dashboardApi } from '../api/dashboard'
import { vocabularyApi } from '../api/vocabulary'
import { activitiesApi } from '../api/activities'

export const queryClient = new QueryClient()

// Constants for stale times
const STATS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PROGRESS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const SESSIONS_STALE_TIME = 60 * 1000; // 1 minute

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

export function useVocabularyItem(id: number) {
  return useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => vocabularyApi.getVocabularyItem(id)
  })
}

export function useCreateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.createVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}

export function useUpdateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.updateVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.deleteVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    }
  })
}

// Sessions hooks
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.getSessions,
    staleTime: SESSIONS_STALE_TIME,
  })
}

export function useSessionStats() {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: sessionsApi.getSessionStats,
    staleTime: STATS_STALE_TIME,
  })
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.getSession(id),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.updateSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session', data.id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

export function useLatestSessions(limit: number = 5) {
  return useQuery({
    queryKey: ['latest-sessions', limit],
    queryFn: () => dashboardApi.getLatestSessions(limit),
    staleTime: SESSIONS_STALE_TIME,
  })
}

export function usePreviousSession(currentSessionId: number) {
  return useQuery({
    queryKey: ['sessions', 'previous', currentSessionId],
    queryFn: () => sessionsApi.getPreviousSession(currentSessionId),
    enabled: !!currentSessionId,
  })
}

export function useLastSession() {
  return useQuery({
    queryKey: ['sessions', 'last'],
    queryFn: sessionsApi.getLastSession,
    staleTime: SESSIONS_STALE_TIME,
  })
}

export function useSessionHistory() {
  return useQuery({
    queryKey: ['sessions', 'history'],
    queryFn: sessionsApi.getSessionHistory,
    staleTime: STATS_STALE_TIME,
  })
}

export function useStartPracticeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.startPracticeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: number; wordId: number; correct: boolean }) =>
      sessionsApi.submitAnswer(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

// Activities hooks
export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.getActivities
  })
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.getActivity(id),
    enabled: !!id,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activitiesApi.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activitiesApi.updateActivity,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', data.id] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activitiesApi.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })
}

export function useStartActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activitiesApi.startActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })
}

export function useActivityProgress(id: number) {
  return useQuery({
    queryKey: ['activity-progress', id],
    queryFn: () => activitiesApi.getActivityProgress(id),
    enabled: !!id,
  })
}

export function useActivityStats() {
  return useQuery({
    queryKey: ['activity-stats'],
    queryFn: activitiesApi.getActivityStats,
    staleTime: STATS_STALE_TIME,
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: activitiesApi.getRecentActivity,
    staleTime: STATS_STALE_TIME,
  })
}

export function useActivityHistory() {
  return useQuery({
    queryKey: ['activity-history'],
    queryFn: activitiesApi.getActivityHistory,
    staleTime: STATS_STALE_TIME,
  })
}

export function usePracticeStats() {
  return useQuery({
    queryKey: ['practice-stats'],
    queryFn: activitiesApi.getPracticeStats,
    staleTime: STATS_STALE_TIME,
  })
}

// Add achievement-related hooks
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch('/api/achievements')
      if (!response.ok) throw new Error('Failed to fetch achievements')
      return response.json()
    }
  })
}

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await fetch('/api/badges')
      if (!response.ok) throw new Error('Failed to fetch badges')
      return response.json()
    }
  })
}

export function useImportData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to import data')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    }
  })
}

export function useVocabularyGroups() {
  return useQuery({
    queryKey: ['vocabulary-groups'],
    queryFn: vocabularyApi.getVocabularyGroups
  })
}

export function useVocabularyStats() {
  return useQuery({
    queryKey: ['vocabularyStats'],
    queryFn: async () => {
      const response = await fetch('/api/vocabulary/stats')
      if (!response.ok) throw new Error('Failed to fetch vocabulary stats')
      return response.json()
    }
  })
}

export function useCreateVocabularyGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.createVocabularyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useVocabularyGroup(id: number) {
  return useQuery({
    queryKey: ['vocabulary-group', id],
    queryFn: () => vocabularyApi.getVocabularyGroup(id)
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.updateVocabularyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.deleteVocabularyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useGroupStats(id: number) {
  return useQuery({
    queryKey: ['group-stats', id],
    queryFn: () => vocabularyApi.getGroupStats(id)
  })
}

export function useMergeGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: number; targetId: number }) => 
      vocabularyApi.mergeGroups(sourceId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useUpdateGoals() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (goals: Goal[]) => {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals)
      })
      if (!response.ok) throw new Error('Failed to update goals')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await fetch('/api/goals')
      if (!response.ok) throw new Error('Failed to fetch goals')
      return response.json()
    }
  })
}

// Enhanced dashboard hooks with better error handling and caching
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getDashboardStats,
    staleTime: STATS_STALE_TIME,
  })
}

export function useDashboardProgress() {
  return useQuery({
    queryKey: ['dashboard-progress'],
    queryFn: dashboardApi.getDashboardProgress,
    staleTime: PROGRESS_STALE_TIME,
  })
}

export function useDashboardData(sessionsLimit: number = 5) {
  return useQuery({
    queryKey: ['dashboard-data', sessionsLimit],
    queryFn: () => dashboardApi.getDashboardData(sessionsLimit),
    staleTime: STATS_STALE_TIME,
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to fetch user profile')
      return response.json()
    }
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<UpdateProfileData>) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update profile')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch('/api/vocabulary-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create group')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    }
  })
}

export function useVocabularyWords() {
  return useQuery({
    queryKey: ['vocabulary-words'],
    queryFn: async () => {
      const response = await fetch('/api/vocabulary-words')
      if (!response.ok) throw new Error('Failed to fetch vocabulary words')
      return response.json()
    }
  })
}

export function usePracticeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      mode: string
      difficulty: string
      wordIds: number[]
    }) => {
      const response = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create practice session')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-stats'] })
      queryClient.invalidateQueries({ queryKey: ['learning-stats'] })
    }
  })
}

export function useClaimReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (achievementId: number) => {
      const response = await fetch(`/api/achievements/${achievementId}/claim`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to claim reward')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    }
  })
}

// Add these practice-specific hooks
export function useStartPractice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { type: string; difficulty: string; wordCount: number }) => {
      const response = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to start practice')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice'] })
    }
  })
}

export function useCheckAnswer() {
  return useMutation({
    mutationFn: async (data: { practiceId: number; answer: string }) => {
      const response = await fetch(`/api/practice/${data.practiceId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to check answer')
      return response.json()
    }
  })
}