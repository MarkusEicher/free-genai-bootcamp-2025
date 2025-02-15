export interface VocabularyItem {
  id: number
  word: string
  translation: string
  examples?: string[]
  tags?: string[]
  progress: number
  group?: VocabularyGroup
}

export interface VocabularyGroup {
  id: number
  name: string
  description?: string
  words: VocabularyWord[]
  mastered: number
  createdAt?: string
  updatedAt?: string
}

export interface VocabularyWord {
  id: number
  word: string
  translation: string
  pronunciation?: string
  notes?: string
  examples?: string
  tags: string[]
  groupId: number
  createdAt?: string
  updatedAt?: string
  practiceCount?: number
  accuracy?: number
} 