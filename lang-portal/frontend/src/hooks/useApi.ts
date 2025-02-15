import { useQuery, useMutation, QueryClient } from '@tanstack/react-query'
import { vocabularyApi } from '../api/vocabulary'
import { sessionsApi } from '../api/sessions'
import { activitiesApi } from '../api/activities'
import { settingsApi } from '../api/settings'

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

// Sessions hooks
export const useSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.getAll
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