export interface UserProfile {
  id: number
  displayName: string
  bio?: string
  nativeLanguage: string
  learningLanguages: string[]
  dailyGoal: number
  publicProfile: boolean
  createdAt: string
  updatedAt: string
}

export type UpdateProfileData = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> 