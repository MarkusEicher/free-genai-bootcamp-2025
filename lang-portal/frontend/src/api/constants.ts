/**
 * API Endpoint Constants
 * Centralizes all API endpoint paths and ensures consistency across the application
 */

export const API_VERSION = 'v1';
export const API_HOST = 'http://localhost:8000';
export const BASE_URL = `${API_HOST}/api/${API_VERSION}`;

export const API_ENDPOINTS = {
  LOGS: {
    /** Store frontend logs */
    STORE: `${BASE_URL}/logs/logs`,
    /** View logs */
    VIEW: `${BASE_URL}/logs/view`
  },
  DASHBOARD: {
    /** Get overall dashboard statistics */
    STATS: `${BASE_URL}/dashboard/stats`,
    /** Get learning progress data */
    PROGRESS: `${BASE_URL}/dashboard/progress`,
    /** Get latest learning sessions */
    LATEST_SESSIONS: `${BASE_URL}/dashboard/latest-sessions`
  },
  SESSIONS: {
    /** Get all sessions */
    LIST: `${BASE_URL}/sessions`,
    /** Get session by ID */
    DETAIL: (id: number) => `${BASE_URL}/sessions/${id}`,
    /** Get previous session */
    PREVIOUS: (id: number) => `${BASE_URL}/sessions/${id}/previous`,
    /** Get last completed session */
    LAST: `${BASE_URL}/sessions/last`,
    /** Get session history */
    HISTORY: `${BASE_URL}/sessions/history`
  },
  VOCABULARY: {
    /** Get vocabulary list */
    LIST: `${BASE_URL}/vocabulary`,
    /** Get vocabulary item by ID */
    DETAIL: (id: number) => `${BASE_URL}/vocabulary/${id}`
  },
  ACTIVITIES: {
    /** Get all activities */
    LIST: `${BASE_URL}/activities`,
    /** Get activity by ID */
    DETAIL: (id: number) => `${BASE_URL}/activities/${id}`,
    /** Start activity */
    START: (id: number) => `${BASE_URL}/activities/${id}/start`
  }
} as const;

// Type for API endpoints to ensure type safety when using endpoints
export type ApiEndpoints = typeof API_ENDPOINTS;