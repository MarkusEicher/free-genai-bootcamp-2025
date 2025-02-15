export interface UserProfile {
  id: number
  name: string
  email: string
  dailyGoal: number
  level: string
  createdAt: string
  updatedAt: string
}

export type UpdateProfileData = Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>> 