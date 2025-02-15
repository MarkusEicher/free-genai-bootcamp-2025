import apiClient from './client'

export interface Settings {
  theme: 'light' | 'dark'
}

export const settingsApi = {
  getSettings: async (): Promise<Settings> => {
    const response = await apiClient.get<Settings>('/settings')
    return response.data
  },
  
  updateSettings: async (settings: Settings): Promise<Settings> => {
    const response = await apiClient.put<Settings>('/settings', settings)
    return response.data
  },
  
  resetProgress: async (): Promise<void> => {
    await apiClient.post('/settings/reset')
  }
} 