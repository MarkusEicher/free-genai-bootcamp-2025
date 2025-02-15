import apiClient from './client'

export interface Activity {
  id: number
  title: string
  description: string
  duration: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  type: string
}

export interface ActivityResult {
  sessionId: number
  activityId: number
  score: number
  completedAt: string
}

export const activitiesApi = {
  getAll: async (): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>('/activities')
    return response.data
  },
  
  getById: async (id: number): Promise<Activity> => {
    const response = await apiClient.get<Activity>(`/activities/${id}`)
    return response.data
  },
  
  start: async (id: number): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>(`/activities/${id}/launch`)
    return response.data
  },
    
  submitResult: async (result: Omit<ActivityResult, 'completedAt'>): Promise<ActivityResult> => {
    const response = await apiClient.post<ActivityResult>('/activity-results', result)
    return response.data
  }
} 