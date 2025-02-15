export interface SessionActivity {
  id: number
  name: string
  score: number
  duration: number
}

export interface Session {
  id: number
  date: string
  duration: number
  score: number
  activities: {
    id: number
    name: string
    duration: number
    score: number
  }[]
}

export interface SessionStats {
  currentStreak: number
  bestStreak: number
  totalSessions: number
  averageScore: number
  averageDuration: number
} 