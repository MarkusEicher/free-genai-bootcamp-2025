export type ActivityDetailsType = {
  quiz: {
    totalQuestions: number
    correctAnswers: number
  }
  flashcard: {
    cardsReviewed: number
    recallRate: number
  }
  writing: {
    wordsWritten: number
    accuracy: number
  }
  reading: {
    passagesRead: number
    comprehension: number
  }
}

export interface Activity {
  id: number
  name: string
  score: number
  type: keyof ActivityDetailsType
  completedAt: string
  details: ActivityDetailsType[keyof ActivityDetailsType]
}

export interface PracticedWord {
  id: number
  word: string
  translation: string
  correct: boolean
  attempts: number
}

export interface Session {
  id: number
  date: string
  overallScore: number
  activities: Activity[]
  words: PracticedWord[]
  duration: number // in minutes
  streak: number
}

export interface SessionFilters {
  startDate: Date | null
  endDate: Date | null
  minScore?: number
  activityType?: Activity['type']
}