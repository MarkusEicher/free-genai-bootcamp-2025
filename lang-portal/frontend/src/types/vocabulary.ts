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
  wordCount: number
  createdAt: string
  updatedAt: string
}

export interface VocabularyWord {
  id: number
  groupId: number
  word: string
  translation: string
  notes?: string
  examples: string[]
  createdAt: string
  updatedAt: string
} 