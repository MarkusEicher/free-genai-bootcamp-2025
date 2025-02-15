export interface UserProfile {
  id: number
  name: string
  email: string
  bio?: string
  nativeLanguage: string
  learningLanguage: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
  targetLanguage: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'
  dailyGoal: number
  notifications: boolean
  stats?: {
    streak: number
    wordsLearned: number
    totalStudyTime: number
    averageAccuracy: number
  }
}

export interface UserSettings {
  id: number
  userId: number
  emailNotifications: boolean
  dailyGoal: number
  theme: 'light' | 'dark'
  soundEffects: boolean
  showTimer: boolean
}