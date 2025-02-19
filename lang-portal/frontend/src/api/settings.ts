import apiClient from './client'

export const settingsApi = {
  reset: async (): Promise<void> => {
    await apiClient.post('/api/v1/settings/reset')
  }
}