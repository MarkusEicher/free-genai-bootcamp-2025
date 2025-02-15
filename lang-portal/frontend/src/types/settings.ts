export interface UserSettings {
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  dailyGoal: number
  emailNotifications: boolean
  soundEffects: boolean
  darkMode: boolean
  showTimer: boolean
}