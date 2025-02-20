/**
 * API Configuration
 * Centralizes API settings and ensures local-only access
 */

import { API_VERSION, BASE_URL } from './constants';

interface FetchApiOptions extends RequestInit {
  params?: Record<string, any>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Remove any leading slash and ensure endpoint doesn't start with BASE_URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const finalEndpoint = cleanEndpoint.startsWith('api/v1/') ? cleanEndpoint : `api/v1/${cleanEndpoint}`;
  const url = new URL(finalEndpoint, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
  }

  console.log('Fetching:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: 'An unknown error occurred' };
      }

      console.error('API Error:', {
        status: response.status,
        url: url.toString(),
        errorData
      });

      throw new ApiError(
        errorData.detail || 'An error occurred',
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('Fetch error:', {
      error,
      endpoint: url.toString()
    });
    
    throw new ApiError(
      'Failed to fetch data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Add better error logging
export const handleApiError = (error: unknown) => {
  console.error('API Error:', {
    status: error instanceof Response ? error.status : 'unknown',
    timestamp: new Date().toISOString()
  });

  if (error instanceof Response) {
    if (error.status === 422) {
      return new Error('Invalid request. Please check your input.');
    }
    if (error.status === 404) {
      return new Error('Resource not found.');
    }
  }
  return new Error('An unexpected error occurred. Please try again.');
};