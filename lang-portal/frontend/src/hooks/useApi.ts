import { VocabularyItem } from '../types/vocabulary'
import type { VocabularyWord, VocabularyGroup } from '../types/vocabulary'
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import { Activity } from '../types/activities'
import { Goal } from '../types/goals'
import type { UserProfile, UpdateProfileData } from '../types/profile'
import { api } from '../lib/api'

export const queryClient = new QueryClient()

// Vocabulary hooks
export function useVocabulary() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['vocabulary'],
    queryFn: () => api.get('/vocabulary')
  })

  const mutation = useMutation({
    mutationFn: (newVocabulary: any) => api.put('/vocabulary', newVocabulary),
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
    queryFn: async () => {
      const response = await fetch(`/api/vocabulary/${id}`)
      if (!response.ok) throw new Error('Failed to fetch vocabulary item')
      return response.json()
    }
  })
}

export function useCreateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newWord: Omit<VocabularyItem, 'id'>) => {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord),
      })
      if (!response.ok) throw new Error('Failed to create word')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}

export function useUpdateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (word: VocabularyItem) => {
      const response = await fetch(`/api/vocabulary/${word.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(word),
      })
      if (!response.ok) throw new Error('Failed to update word')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/vocabulary/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete vocabulary item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    }
  })
}

// Sessions hooks
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Failed to fetch sessions')
      return response.json()
    }
  })
}

export function useSessionStats() {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const response = await fetch('/api/sessions/stats')
      if (!response.ok) throw new Error('Failed to fetch session stats')
      return response.json()
    }
  })
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${id}`)
      if (!response.ok) throw new Error('Failed to fetch session')
      return response.json()
    }
  })
}

export const useCreateSession = () => {
  return useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })
}

// Activities hooks
export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await fetch('/api/activities')
      if (!response.ok) throw new Error('Failed to fetch activities')
      return response.json()
    }
  })
}

export function useStartActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (activityId: number) => {
      const response = await fetch(`/api/activities/${activityId}/start`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to start activity')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Activity & { id: number }) => {
      const response = await fetch(`/api/activities/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update activity')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
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

export function useActivityStats() {
  return useQuery({
    queryKey: ['activityStats'],
    queryFn: async () => {
      const response = await fetch('/api/activities/stats')
      if (!response.ok) throw new Error('Failed to fetch activity stats')
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
    queryFn: async () => {
      const response = await fetch('/api/vocabulary-groups')
      if (!response.ok) throw new Error('Failed to fetch vocabulary groups')
      return response.json()
    }
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
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('/api/vocabulary-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create vocabulary group')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useVocabularyGroup(id: number) {
  return useQuery({
    queryKey: ['vocabulary-group', id],
    queryFn: async () => {
      const response = await fetch(`/api/vocabulary-groups/${id}`)
      if (!response.ok) throw new Error('Failed to fetch group')
      return response.json()
    },
    enabled: !!id
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<VocabularyGroup>) => {
      const response = await fetch(`/api/vocabulary-groups/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update group')
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-group', data.id] })
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/vocabulary-groups/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete group')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-groups'] })
    }
  })
}

export function useGroupStats() {
  return useQuery({
    queryKey: ['groupStats'],
    queryFn: async () => {
      const response = await fetch('/api/vocabulary/groups/stats')
      if (!response.ok) throw new Error('Failed to fetch group stats')
      return response.json()
    }
  })
}

export function useMergeGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { sourceGroupId: number; targetGroupId: number }) => {
      const response = await fetch('/api/vocabulary/groups/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to merge groups')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularyGroups'] })
      queryClient.invalidateQueries({ queryKey: ['groupStats'] })
    }
  })
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${id}`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      return response.json()
    }
  })
}

export function useActivityProgress(id: number) {
  return useQuery({
    queryKey: ['activity-progress', id],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${id}/progress`)
      if (!response.ok) throw new Error('Failed to fetch activity progress')
      return response.json()
    }
  })
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { activityId: number; step: number; answer: string }) => {
      const response = await fetch(`/api/activities/${data.activityId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to submit answer')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['activity', variables.activityId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['activity-progress', variables.activityId] 
      })
    }
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Activity, 'id' | 'progress' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create activity')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })
}

export function usePreviousSession(currentSessionId: number) {
  return useQuery({
    queryKey: ['previous-session', currentSessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${currentSessionId}/previous`)
      if (!response.ok) throw new Error('Failed to fetch previous session')
      return response.json()
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

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      return response.json()
    }
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/activity')
      if (!response.ok) throw new Error('Failed to fetch recent activity')
      return response.json()
    }
  })
}

export function usePerformanceHistory() {
  return useQuery({
    queryKey: ['performance-history'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/performance-history')
      if (!response.ok) throw new Error('Failed to fetch performance history')
      return response.json()
    }
  })
}

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/streak')
      if (!response.ok) throw new Error('Failed to fetch streak')
      return response.json()
    }
  })
}

export function useLastSession() {
  return useQuery({
    queryKey: ['last-session'],
    queryFn: async () => {
      const response = await fetch('/api/sessions/last')
      if (!response.ok) throw new Error('Failed to fetch last session')
      return response.json()
    }
  })
}

export function useAddWord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/vocabulary-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to add word')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-group', variables.groupId] })
    }
  })
}

export function useVocabularyWord(id: number) {
  return useQuery({
    queryKey: ['vocabulary-word', id],
    queryFn: async () => {
      const response = await fetch(`/api/vocabulary-words/${id}`)
      if (!response.ok) throw new Error('Failed to fetch word')
      return response.json()
    },
    enabled: !!id
  })
}

export function useUpdateWord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<VocabularyWord>) => {
      const response = await fetch(`/api/vocabulary-words/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update word')
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-word', data.id] })
      queryClient.invalidateQueries({ queryKey: ['vocabulary-words'] })
    }
  })
}

export function useDeleteWord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/vocabulary-words/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete word')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-words'] })
    }
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

export function useActivityHistory() {
  return useQuery({
    queryKey: ['activity-history'],
    queryFn: async () => {
      const response = await fetch('/api/activity-history')
      if (!response.ok) throw new Error('Failed to fetch activity history')
      return response.json()
    }
  })
}

export function usePracticeStats() {
  return useQuery({
    queryKey: ['practice-stats'],
    queryFn: async () => {
      const response = await fetch('/api/practice-stats')
      if (!response.ok) throw new Error('Failed to fetch practice stats')
      return response.json()
    }
  })
}

export function useRecommendedWords() {
  return useQuery({
    queryKey: ['recommended-words'],
    queryFn: async () => {
      const response = await fetch('/api/recommended-words')
      if (!response.ok) throw new Error('Failed to fetch recommended words')
      return response.json()
    }
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      return response.json()
    }
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to mark notification as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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

export function useLearningStats(userId: number) {
  return useQuery({
    queryKey: ['learning-stats', userId],
    queryFn: async () => {
      const response = await fetch(`/api/learning-stats/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch learning stats')
      return response.json()
    },
    enabled: !!userId
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

export function useUserAchievements(userId: number) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/achievements`)
      if (!response.ok) throw new Error('Failed to fetch user achievements')
      return response.json()
    },
    enabled: !!userId
  })
}

export function useUserStats(userId: number) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch user stats')
      return response.json()
    },
    enabled: !!userId
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

export function useUpdateStats() {
  return useMutation({
    mutationFn: (stats: {
      wordsLearned: number
      currentStreak: number
      successRate: number
      totalMinutes: number
      recentActivity: Array<{
        type: string
        date: string
        details: string
      }>
    }) => api.put('/stats', stats)
  })
}