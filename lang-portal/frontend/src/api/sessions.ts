import { fetchApi, ApiError } from './config';
import { API_ENDPOINTS } from './constants';
import type { Session, SessionStats, SessionHistory } from '../types/sessions';

const defaultStats: SessionStats = {
  total_sessions: 0,
  completed_sessions: 0,
  average_score: 0,
  total_time: 0
};

export const sessionsApi = {
  // Get all sessions
  getSessions: async (): Promise<Session[]> => {
    try {
      return await fetchApi<Session[]>(API_ENDPOINTS.SESSIONS.LIST);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get session statistics
  getSessionStats: async (): Promise<SessionStats> => {
    try {
      return await fetchApi<SessionStats>(`${API_ENDPOINTS.SESSIONS.LIST}/stats`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return defaultStats;
      }
      throw error;
    }
  },

  // Get a single session
  getSession: async (id: number): Promise<Session> => {
    return await fetchApi<Session>(API_ENDPOINTS.SESSIONS.DETAIL(id));
  },

  // Create a new session
  createSession: async (data: Partial<Session>): Promise<Session> => {
    return await fetchApi<Session>(API_ENDPOINTS.SESSIONS.LIST, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update a session
  updateSession: async (id: number, data: Partial<Session>): Promise<Session> => {
    return await fetchApi<Session>(API_ENDPOINTS.SESSIONS.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete a session
  deleteSession: async (id: number): Promise<void> => {
    await fetchApi(API_ENDPOINTS.SESSIONS.DETAIL(id), {
      method: 'DELETE'
    });
  },

  // Get latest sessions
  getLatestSessions: (limit: number = 5) =>
    fetchApi<Session[]>(`sessions/latest?limit=${limit}`),

  // Get previous session
  getPreviousSession: async (currentSessionId: number): Promise<Session | null> => {
    try {
      return await fetchApi<Session>(API_ENDPOINTS.SESSIONS.PREVIOUS(currentSessionId));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get last session
  getLastSession: async (): Promise<Session | null> => {
    try {
      return await fetchApi<Session>(API_ENDPOINTS.SESSIONS.LAST);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get session history
  getSessionHistory: async (): Promise<SessionHistory[]> => {
    try {
      return await fetchApi<SessionHistory[]>(API_ENDPOINTS.SESSIONS.HISTORY);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Start practice session
  startPracticeSession: async (data: { groupId: number; type: string }): Promise<Session> => {
    return await fetchApi<Session>(`${API_ENDPOINTS.SESSIONS.LIST}/practice`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Submit session answer
  submitAnswer: async (
    sessionId: number,
    data: { wordId: number; correct: boolean }
  ): Promise<Session> => {
    return await fetchApi<Session>(`${API_ENDPOINTS.SESSIONS.DETAIL(sessionId)}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};