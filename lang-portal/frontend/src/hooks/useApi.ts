import { VocabularyItem } from '../types/vocabulary'
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query'
import { vocabularyApi } from '../api/vocabulary'
import { sessionsApi } from '../api/sessions'
import { activitiesApi } from '../api/activities'
import { settingsApi } from '../api/settings'
import { Session } from '../types/session'

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
export const useActivities = () => {
  return useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll()
  })
}

export const useStartActivity = () => {
  return useMutation({
    mutationFn: activitiesApi.start
  })
}

// Settings hooks
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings
  })
}

export const useUpdateSettings = () => {
  return useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
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