import type { ActivityDetailsType } from './session'

export interface ActivityStats {
  completed: number
  averageScore: number
  timeSpent: number
  lastAttempt?: string
}

export interface Activity {
  id: number
  name: string
  description: string
  type: keyof ActivityDetailsType
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  stats: ActivityStats
  progress: number // 0 to 1
  estimatedTime?: number // in minutes
  prerequisites?: number[] // activity IDs
} 