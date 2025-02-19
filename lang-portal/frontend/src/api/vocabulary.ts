import { fetchApi, ApiError } from './config';
import { API_ENDPOINTS } from './constants';
import type { VocabularyItem, VocabularyGroup } from '../types/vocabulary';

const defaultVocabularyStats = {
  total_items: 0,
  mastered_items: 0,
  learning_items: 0,
  groups_count: 0
};

export const vocabularyApi = {
  getVocabulary: async (): Promise<VocabularyItem[]> => {
    try {
      return await fetchApi<VocabularyItem[]>(API_ENDPOINTS.VOCABULARY.LIST);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  getVocabularyItem: async (id: number): Promise<VocabularyItem> => {
    return await fetchApi<VocabularyItem>(API_ENDPOINTS.VOCABULARY.DETAIL(id));
  },

  createVocabulary: async (data: Omit<VocabularyItem, 'id'>): Promise<VocabularyItem> => {
    return await fetchApi<VocabularyItem>(API_ENDPOINTS.VOCABULARY.LIST, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateVocabulary: async (id: number, data: Partial<VocabularyItem>): Promise<VocabularyItem> => {
    return await fetchApi<VocabularyItem>(API_ENDPOINTS.VOCABULARY.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteVocabulary: async (id: number): Promise<void> => {
    await fetchApi(API_ENDPOINTS.VOCABULARY.DETAIL(id), {
      method: 'DELETE'
    });
  },

  getVocabularyStats: async () => {
    try {
      return await fetchApi<typeof defaultVocabularyStats>(`${API_ENDPOINTS.VOCABULARY.LIST}/stats`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return defaultVocabularyStats;
      }
      throw error;
    }
  },

  // Group operations
  getGroups: async (): Promise<VocabularyGroup[]> => {
    try {
      return await fetchApi<VocabularyGroup[]>(`${API_ENDPOINTS.VOCABULARY.LIST}/groups`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  getGroup: async (id: number): Promise<VocabularyGroup> => {
    return await fetchApi<VocabularyGroup>(`${API_ENDPOINTS.VOCABULARY.LIST}/groups/${id}`);
  },

  createGroup: async (data: Omit<VocabularyGroup, 'id'>): Promise<VocabularyGroup> => {
    return await fetchApi<VocabularyGroup>(`${API_ENDPOINTS.VOCABULARY.LIST}/groups`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateGroup: async (id: number, data: Partial<VocabularyGroup>): Promise<VocabularyGroup> => {
    return await fetchApi<VocabularyGroup>(`${API_ENDPOINTS.VOCABULARY.LIST}/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteGroup: async (id: number): Promise<void> => {
    await fetchApi(`${API_ENDPOINTS.VOCABULARY.LIST}/groups/${id}`, {
      method: 'DELETE'
    });
  },

  // Item operations within groups
  addItemToGroup: async (groupId: number, itemId: number): Promise<void> => {
    await fetchApi(`${API_ENDPOINTS.VOCABULARY.LIST}/groups/${groupId}/items/${itemId}`, {
      method: 'POST'
    });
  },

  removeItemFromGroup: async (groupId: number, itemId: number): Promise<void> => {
    await fetchApi(`${API_ENDPOINTS.VOCABULARY.LIST}/groups/${groupId}/items/${itemId}`, {
      method: 'DELETE'
    });
  },

  // Progress tracking
  updateProgress: async (id: number, data: { status: 'learning' | 'mastered' }): Promise<VocabularyItem> => {
    return await fetchApi<VocabularyItem>(`${API_ENDPOINTS.VOCABULARY.DETAIL(id)}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};