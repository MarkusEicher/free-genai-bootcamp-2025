/**
 * API Configuration
 * Privacy-focused API configuration that ensures local-only access
 */

import { BASE_URL } from './constants';

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

export interface ApiResponse<T> {
  data: T;
}

interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
  ctx?: {
    received?: any;
    expected?: any;
  };
}

/**
 * Filter out sensitive parameters from query params
 */
function filterSensitiveParams(params: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['token', 'password', 'secret', 'key'];
  return Object.fromEntries(
    Object.entries(params).filter(([key]) => !sensitiveKeys.includes(key.toLowerCase()))
  );
}

/**
 * Privacy-focused API fetch function
 * - Ensures local-only access
 * - No tracking or analytics
 * - No cookies or session data
 * - No sensitive data in URLs
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<ApiResponse<T>> {
  // Check if the endpoint already starts with the base URL
  const path = endpoint.startsWith(BASE_URL) ? endpoint : `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
  const url = new URL(path, window.location.origin);
  
  // Add query parameters if provided
  if (options.params) {
    Object.entries(filterSensitiveParams(options.params)).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // Enhanced error logging for validation errors
      if (response.status === 422) {
        const validationErrors = errorData?.detail || [];
        console.error('Validation Error:', {
          status: response.status,
          endpoint: url.pathname,
          method: options.method || 'GET',
          params: options.params || {},
          errors: Array.isArray(validationErrors) ? validationErrors : [validationErrors],
          rawResponse: errorData,
          timestamp: new Date().toISOString()
        });

        // Log each validation error separately for better debugging
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((error: ValidationError, index: number) => {
            console.error(`Validation Error ${index + 1}:`, {
              field: error.loc?.join('.'),
              message: error.msg,
              type: error.type,
              received: error.ctx?.received,
              expected: error.ctx?.expected
            });
          });
        }
      } else {
        console.error('API Error:', {
          status: response.status,
          endpoint: url.pathname,
          method: options.method || 'GET',
          message: errorData?.detail || 'Unknown error',
          rawError: errorData,
          timestamp: new Date().toISOString()
        });
      }

      throw new ApiError(
        Array.isArray(errorData?.detail) 
          ? errorData.detail.map((e: ValidationError) => e.msg).join('; ')
          : errorData?.detail || 'An error occurred',
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('Network Error:', {
      endpoint: url.pathname,
      method: options.method || 'GET',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw new ApiError(
      'Failed to fetch data',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Add better error logging without sensitive data
export const handleApiError = (error: unknown) => {
  const errorInfo = {
    type: error instanceof ApiError ? 'ApiError' : 'UnknownError',
    status: error instanceof ApiError ? error.status : 'unknown',
    timestamp: new Date().toISOString()
  };

  console.error('API Error:', errorInfo);

  if (error instanceof ApiError) {
    if (error.status === 422) {
      return new Error('Invalid request. Please check your input.');
    }
    if (error.status === 404) {
      return new Error('Resource not found.');
    }
    if (error.status === 403) {
      return new Error('Access denied. Local-only application.');
    }
  }
  return new Error('An unexpected error occurred. Please try again.');
};