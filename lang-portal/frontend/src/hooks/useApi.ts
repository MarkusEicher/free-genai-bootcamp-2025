import { VocabularyItem } from '../types/vocabulary'
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import { settingsApi } from '../api/settings'
import { Activity } from '../types/activities'
import { Goal } from '../types/goals'

interface UserSettings {
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  dailyGoal: number
  emailNotifications: boolean
  soundEffects: boolean
  darkMode: boolean
  showTimer: boolean
}

export const queryClient = new QueryClient()

// Vocabulary hooks
export function useVocabulary(groupId?: number | null) {
  return useQuery({
    queryKey: ['vocabulary', groupId],
    queryFn: async () => {
      const url = groupId 
        ? `/api/vocabulary?groupId=${groupId}`
        : '/api/vocabulary'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch vocabulary')
      return response.json()
    }
  })
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
export function useSessions(timeframe: 'week' | 'month' | 'all') {
  return useQuery({
    queryKey: ['sessions', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/sessions?timeframe=${timeframe}`)
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

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      return response.json()
    }
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!response.ok) throw new Error('Failed to update settings')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/export')
      if (!response.ok) throw new Error('Failed to export data')
      return response.json()
    }
  })
}

export const useResetProgress = () => {
  return useMutation({
    mutationFn: settingsApi.resetProgress,
    onSuccess: () => {
      queryClient.invalidateQueries()
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

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/vocabulary/groups/${groupId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete group')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularyGroups'] })
    }
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: number; name: string }) => {
      const response = await fetch(`/api/vocabulary/groups/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name })
      })
      if (!response.ok) throw new Error('Failed to update group')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularyGroups'] })
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