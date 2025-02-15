export type ActivityType = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing'

export interface Activity {
  id: number
  name: string
  type: ActivityType
  progress: number
  updatedAt: string
  createdAt: string
  description?: string
  goals?: string[]
  completedSteps?: number
  totalSteps?: number
  steps?: ActivityStep[]
  date: string
  details?: string
}

export interface ActivityStats {
  totalActivities: number
  completedActivities: number
  inProgressActivities: number
  averageProgress: number
}

export interface ActivityProgress {
  recent: {
    timestamp: string
    action: string
    score?: number
    timeSpent?: number
  }[]
  totalTime?: number
  achievements?: {
    name: string
    description: string
  }[]
}

export interface ActivityStep {
  prompt: string
  hint?: string
} 