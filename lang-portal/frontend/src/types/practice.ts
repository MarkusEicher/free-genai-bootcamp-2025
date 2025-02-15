export interface WordProgress {
  wordId: number
  level: number
  nextReview: string
  history: {
    date: string
    correct: boolean
  }[]
}

export interface PracticeSession {
  id: number
  type: 'vocabulary' | 'grammar' | 'listening'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  progress: number
  score: number
  createdAt: string
  updatedAt: string
}

export interface PracticeResults {
  correct: number
  total: number
  mode: 'typing' | 'multipleChoice' | 'flashcard'
  duration: number
  wordResults: {
    wordId: number
    correct: boolean
    timeSpent: number
  }[]
}

export interface PracticeQuestion {
  id: number
  question: string
  correctAnswer: string
  options?: string[]
  type: 'multiple-choice' | 'text-input'
}

export interface PracticeResult {
  correct: boolean
  correctAnswer: string
  explanation?: string
} 