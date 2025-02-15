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
  date: string
  mode: 'typing' | 'multipleChoice' | 'flashcard'
  words: number[]
  results: {
    wordId: number
    correct: boolean
    timeSpent: number
  }[]
  totalTime: number
  score: number
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