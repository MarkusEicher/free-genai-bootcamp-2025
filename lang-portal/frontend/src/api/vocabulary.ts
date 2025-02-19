import { fetchApi } from './config';
import type { VocabularyItem, VocabularyGroup } from '../types/vocabulary';

export const vocabularyApi = {
  // Get all vocabulary items
  getVocabulary: () => 
    fetchApi<VocabularyItem[]>('vocabulary'),

  // Get a single vocabulary item
  getVocabularyItem: (id: number) =>
    fetchApi<VocabularyItem>(`vocabulary/${id}`),

  // Create a new vocabulary item
  createVocabulary: (newWord: Omit<VocabularyItem, 'id'>) =>
    fetchApi<VocabularyItem>('vocabulary', {
      method: 'POST',
      body: JSON.stringify(newWord),
    }),

  // Update a vocabulary item
  updateVocabulary: (word: VocabularyItem) =>
    fetchApi<VocabularyItem>(`vocabulary/${word.id}`, {
      method: 'PUT',
      body: JSON.stringify(word),
    }),

  // Delete a vocabulary item
  deleteVocabulary: (id: number) =>
    fetchApi<void>(`vocabulary/${id}`, {
      method: 'DELETE',
    }),

  // Get vocabulary groups
  getVocabularyGroups: () =>
    fetchApi<VocabularyGroup[]>('vocabulary-groups'),

  // Get a single vocabulary group
  getVocabularyGroup: (id: number) =>
    fetchApi<VocabularyGroup>(`vocabulary-groups/${id}`),

  // Create a new vocabulary group
  createVocabularyGroup: (group: Omit<VocabularyGroup, 'id'>) =>
    fetchApi<VocabularyGroup>('vocabulary-groups', {
      method: 'POST',
      body: JSON.stringify(group),
    }),

  // Update a vocabulary group
  updateVocabularyGroup: (group: VocabularyGroup) =>
    fetchApi<VocabularyGroup>(`vocabulary-groups/${group.id}`, {
      method: 'PUT',
      body: JSON.stringify(group),
    }),

  // Delete a vocabulary group
  deleteVocabularyGroup: (id: number) =>
    fetchApi<void>(`vocabulary-groups/${id}`, {
      method: 'DELETE',
    }),

  // Get vocabulary statistics
  getVocabularyStats: () =>
    fetchApi<any>('vocabulary/stats'),

  // Get group statistics
  getGroupStats: (id: number) =>
    fetchApi<any>(`vocabulary-groups/${id}/stats`),

  // Merge vocabulary groups
  mergeGroups: (sourceId: number, targetId: number) =>
    fetchApi<void>('vocabulary-groups/merge', {
      method: 'POST',
      body: JSON.stringify({ sourceId, targetId }),
    }),
};