import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../api/settings'

export function useReset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: settingsApi.reset,
    onSuccess: () => {
      // Invalidate all queries to refresh data after reset
      queryClient.invalidateQueries()
    }
  })
} 