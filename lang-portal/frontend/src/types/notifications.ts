export interface Notification {
  id: number
  title: string
  message: string
  type: 'achievement' | 'reminder' | 'system' | 'practice'
  read: boolean
  createdAt: string
  link?: string
} 