import apiClient from './client'

export interface Vocabulary {
  id: number
  word: string
  translation: string
  group?: string
}

export const vocabularyApi = {
  getAll: async (): Promise<Vocabulary[]> => {
    const response = await apiClient.get<Vocabulary[]>('/vocabulary')
    return response.data
  },
  
  getById: async (id: number): Promise<Vocabulary> => {
    const response = await apiClient.get<Vocabulary>(`/vocabulary/${id}`)
    return response.data
  },
  
  getByGroup: async (groupId: number): Promise<Vocabulary[]> => {
    const response = await apiClient.get<Vocabulary[]>(`/vocabulary/group/${groupId}`)
    return response.data
  }
} 