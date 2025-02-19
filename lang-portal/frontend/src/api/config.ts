/**
 * API Configuration
 * Centralizes API settings and ensures local-only access
 */

export const API_CONFIG = {
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
} as const;

// Privacy-focused error handling without external logging
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

// Single fetchApi implementation
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit & { 
    params?: { 
      args?: any[];
      kwargs?: Record<string, any>;
    } 
  } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_CONFIG.baseURL}/${endpoint.replace(/^\//, '')}`;

  // Add query parameters if they exist
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.args) {
      searchParams.append('args', JSON.stringify(params.args));
    }
    if (params.kwargs) {
      searchParams.append('kwargs', JSON.stringify(params.kwargs));
    }
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  console.log('Fetching:', url);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...API_CONFIG.headers,
        ...fetchOptions.headers,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.error('API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
      });

      const errorData = await response.text();
      console.error('Error details:', errorData);

      if (response.status === 404) {
        return {} as T; // Return empty object for 404s
      }

      throw new ApiError(
        response.status === 422 ? 'Invalid request data' : 'Failed to fetch data',
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error instanceof ApiError ? error : new ApiError(
      'Network error. Please check your connection.',
      500
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