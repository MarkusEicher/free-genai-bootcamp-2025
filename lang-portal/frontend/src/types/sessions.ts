export interface SessionActivity {
  id: number
  name: string
  score: number
  duration: number
}

export interface Session {
  id: number
  startTime: string
  endTime: string
  duration: number
  score: number
  activitiesCompleted: number
  activities: SessionActivity[]
}

export interface SessionStats {
  currentStreak: number
  bestStreak: number
  totalSessions: number
  averageScore: number
  averageDuration: number
} 