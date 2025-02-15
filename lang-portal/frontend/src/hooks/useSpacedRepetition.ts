import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { VocabularyWord } from '../types/vocabulary'
import type { WordProgress } from '../types/practice'

export function useSpacedRepetition() {
  const queryClient = useQueryClient()

  const getDueWords = useQuery({
    queryKey: ['due-words'],
    queryFn: async () => {
      const response = await fetch('/api/practice/due-words')
      if (!response.ok) throw new Error('Failed to fetch due words')
      return response.json() as Promise<VocabularyWord[]>
    }
  })

  const updateProgress = useMutation({
    mutationFn: async ({ wordId, correct }: { wordId: number; correct: boolean }) => {
      const response = await fetch(`/api/practice/progress/${wordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct })
      })
      if (!response.ok) throw new Error('Failed to update progress')
      return response.json() as Promise<WordProgress>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-words'] })
      queryClient.invalidateQueries({ queryKey: ['practice-stats'] })
    }
  })

  const getNextReviewDate = (level: number): Date => {
    const now = new Date()
    const intervals = [1, 3, 7, 14, 30, 90, 180] // Days between reviews
    const days = intervals[Math.min(level, intervals.length - 1)]
    now.setDate(now.getDate() + days)
    return now
  }

  return {
    dueWords: getDueWords.data || [],
    isLoading: getDueWords.isLoading,
    updateProgress: updateProgress.mutate,
    getNextReviewDate
  }
} 