export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  rewardClaimed?: boolean
  progress?: {
    current: number
    required: number
  }
  reward?: {
    type: 'points' | 'badge' | 'theme' | 'feature'
    description: string
    value: number | string
  }
  target: number
  category: 'streak' | 'vocabulary' | 'practice' | 'mastery'
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Complete your first practice session',
    icon: '🎯',
    unlocked: false,
    progress: { current: 0, required: 1 },
    target: 1,
    category: 'practice'
  },
  {
    id: 2,
    name: 'Word Collector',
    description: 'Learn 50 words',
    icon: '📚',
    unlocked: false,
    progress: { current: 0, required: 50 },
    target: 50,
    category: 'vocabulary'
  },
  {
    id: 3,
    name: 'Dedication',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    unlocked: false,
    progress: { current: 0, required: 7 },
    target: 7,
    category: 'streak'
  },
  {
    id: 4,
    name: 'Perfect Score',
    description: 'Get 100% in a practice session',
    icon: '⭐',
    unlocked: false,
    progress: { current: 0, required: 1 },
    target: 1,
    category: 'practice'
  },
  {
    id: 5,
    name: 'Vocabulary Master',
    description: 'Master 100 words',
    icon: '👑',
    unlocked: false,
    progress: { current: 0, required: 100 },
    target: 100,
    category: 'mastery'
  },
  {
    id: 6,
    name: 'Practice Makes Perfect',
    description: 'Complete 50 practice sessions',
    icon: '🎮',
    unlocked: false,
    progress: { current: 0, required: 50 },
    target: 50,
    category: 'practice'
  },
  {
    id: 7,
    name: 'Marathon Learner',
    description: 'Maintain a 30-day streak',
    icon: '🏃',
    unlocked: false,
    progress: { current: 0, required: 30 },
    target: 30,
    category: 'streak'
  },
  {
    id: 8,
    name: 'Vocabulary Expert',
    description: 'Learn 500 words',
    icon: '🎓',
    unlocked: false,
    progress: { current: 0, required: 500 },
    target: 500,
    category: 'vocabulary'
  }
]

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