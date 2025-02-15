import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useReset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.reset,
    onSuccess: () => {
      // Invalidate all queries to refetch data
      queryClient.invalidateQueries()
      // Clear local storage
      localStorage.clear()
    }
  })
} 