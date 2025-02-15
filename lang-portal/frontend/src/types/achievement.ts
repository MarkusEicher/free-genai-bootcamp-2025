export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  unlockedAt?: string
  progress: number
  requirement: number
  type: 'completion' | 'score' | 'streak' | 'time'
}

export interface Badge {
  id: number
  name: string
  icon: string
  level: 'bronze' | 'silver' | 'gold'
  unlockedAt?: string
} 