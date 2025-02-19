import apiClient from './client'
import type { VocabularyItem } from '../types/vocabulary'

export const vocabularyApi = {
  getVocabulary: async (): Promise<VocabularyItem[]> => {
    const response = await apiClient.get<VocabularyItem[]>('/vocabulary')
    return response.data
  },

  updateVocabulary: async (vocabulary: VocabularyItem): Promise<VocabularyItem> => {
    const response = await apiClient.put<VocabularyItem>(`/vocabulary/${vocabulary.id}`, vocabulary)
    return response.data
  }
}