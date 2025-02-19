import { fetchApi } from './config';
import type { Session, SessionStats } from '../types/sessions';

export const sessionsApi = {
  // Get all sessions
  getSessions: () => 
    fetchApi<Session[]>('sessions'),

  // Get session statistics
  getSessionStats: () =>
    fetchApi<SessionStats>('sessions/stats'),

  // Get a single session
  getSession: (id: number) =>
    fetchApi<Session>(`sessions/${id}`),

  // Create a new session
  createSession: (sessionData: Omit<Session, 'id'>) =>
    fetchApi<Session>('sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),

  // Update a session
  updateSession: (session: Session) =>
    fetchApi<Session>(`sessions/${session.id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    }),

  // Delete a session
  deleteSession: (id: number) =>
    fetchApi<void>(`sessions/${id}`, {
      method: 'DELETE',
    }),

  // Get latest sessions
  getLatestSessions: (limit: number = 5) =>
    fetchApi<Session[]>(`sessions/latest?limit=${limit}`),

  // Get previous session
  getPreviousSession: (currentSessionId: number) =>
    fetchApi<Session>(`sessions/${currentSessionId}/previous`),

  // Get last session
  getLastSession: () =>
    fetchApi<Session>('sessions/last'),

  // Get session history
  getSessionHistory: () =>
    fetchApi<Session[]>('sessions/history'),

  // Start practice session
  startPracticeSession: (data: { type: string; wordIds?: number[] }) =>
    fetchApi<Session>('sessions/practice/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Submit session answer
  submitAnswer: (sessionId: number, data: { wordId: number; correct: boolean }) =>
    fetchApi<void>(`sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};