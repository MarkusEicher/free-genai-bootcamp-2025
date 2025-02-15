export interface DashboardStats {
  masteredWords: number
  totalWords: number
  masteryRate: number
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
  totalSessions: number
  averageAccuracy: number
  totalPracticeTime: number
  progressData: ProgressDataPoint[]
}

export interface ProgressDataPoint {
  date: string
  masteredWords: number
  totalWords: number
}

export interface Activity {
  id: number
  type: 'practice' | 'word_added' | 'group_created' | 'achievement_earned'
  description: string
  timestamp: string
  metadata: {
    wordId?: number
    groupId?: number
    achievementId?: number
    score?: number
  }
} 