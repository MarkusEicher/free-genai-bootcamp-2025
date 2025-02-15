import { VocabularyItem } from '../types/vocabulary'
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query'
import { vocabularyApi } from '../api/vocabulary'
import { sessionsApi } from '../api/sessions'
import { settingsApi } from '../api/settings'
import { Session } from '../types/session'
import { Activity } from '../types/activity'

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
export const useVocabulary = () => {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: vocabularyApi.getAll
  })
}

export const useVocabularyItem = (id: number) => {
  return useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => vocabularyApi.getById(id)
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
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete word')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}

// Sessions hooks
export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Failed to fetch sessions')
      return response.json()
    },
  })
}

export const useSession = (id: number) => {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionsApi.getById(id)
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
  return useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await fetch('/api/activities')
      if (!response.ok) throw new Error('Failed to fetch activities')
      return response.json()
    },
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

export function useActivityStats(activityId: number) {
  return useQuery({
    queryKey: ['activity-stats', activityId],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${activityId}/stats`)
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