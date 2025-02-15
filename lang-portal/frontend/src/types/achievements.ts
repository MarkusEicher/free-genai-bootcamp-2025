export interface Achievement {
  id: string
  badgeId: string
  userId: string
  unlockedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: {
    type: 'sessions' | 'streak' | 'score'
    value: number
  }
} 