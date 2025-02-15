import apiClient from './client'

export interface Session {
  id: number
  date: string
  activities: {
    id: number
    name: string
    score: number
  }[]
  overallScore: number
}

export const sessionsApi = {
  getAll: async (): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/sessions')
    return response.data
  },
  
  getById: async (id: number): Promise<Session> => {
    const response = await apiClient.get<Session>(`/sessions/${id}`)
    return response.data
  },
  
  create: async (): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions')
    return response.data
  }
} 