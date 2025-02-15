import { useQuery } from '@tanstack/react-query'
import type { Achievement } from '../types/achievements'
import { ACHIEVEMENTS } from '../types/achievements'

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch('/api/achievements')
      if (!response.ok) throw new Error('Failed to fetch achievements')
      const userProgress = await response.json()
      
      // Merge predefined achievements with user progress
      return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        ...userProgress.find((p: Achievement) => p.id === achievement.id)
      }))
    }
  })
} 