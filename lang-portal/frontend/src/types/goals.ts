export interface Goal {
  type: 'daily' | 'weekly'
  target: number
  metric: 'sessions' | 'duration' | 'score'
} 