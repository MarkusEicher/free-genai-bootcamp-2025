/**
 * API Configuration
 * Privacy-focused API configuration that ensures local-only access
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

interface CacheHeaders {
  'X-Cache-Status': 'HIT' | 'MISS';
  'Cache-Control': string;
  'X-Cache-Expires': string;
}

export interface ApiResponse<T> {
  data: T;
  cacheInfo?: {
    hit: boolean;
    timestamp: number;
    expires: number;
  };
}

/**
 * Parse cache headers from response
 */
function parseCacheHeaders(headers: Headers): ApiResponse<any>['cacheInfo'] {
  const cacheStatus = headers.get('X-Cache-Status');
  const cacheControl = headers.get('Cache-Control');
  const cacheExpires = headers.get('X-Cache-Expires');

  if (!cacheStatus) return undefined;

  return {
    hit: cacheStatus === 'HIT',
    timestamp: Date.now(),
    expires: cacheExpires ? parseInt(cacheExpires, 10) : Date.now() + 300000 // 5 minutes default
  };
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
  const { params, ...fetchOptions } = options;

  // Remove any leading slash and ensure endpoint doesn't start with BASE_URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const finalEndpoint = cleanEndpoint.startsWith('api/v1/') ? cleanEndpoint : `api/v1/${cleanEndpoint}`;
  
  // Ensure we're only making requests to localhost
  const url = new URL(finalEndpoint, window.location.origin);
  if (!url.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
    throw new ApiError('Only local connections are allowed', 403);
  }

  // Filter out any sensitive or tracking-related parameters
  const filteredParams = params ? filterSensitiveParams(params) : {};
  
  // Add filtered parameters to URL
  if (Object.keys(filteredParams).length > 0) {
    Object.entries(filteredParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      // Ensure privacy-focused headers
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Privacy-Mode': 'strict',
        ...fetchOptions.headers,
      },
      // Prevent credentials and cookies
      credentials: 'omit',
      cache: 'no-store',
      mode: 'same-origin',
      referrerPolicy: 'strict-origin-when-cross-origin',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: 'An unknown error occurred' };
      }

      // Log error without sensitive information
      console.error('API Error:', {
        status: response.status,
        endpoint: url.pathname,
        timestamp: new Date().toISOString()
      });

      throw new ApiError(
        errorData.detail || 'An error occurred',
        response.status,
        errorData
      );
    }

    const data = await response.json();
    const cacheInfo = parseCacheHeaders(response.headers);

    return { data, cacheInfo };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Log error without sensitive information
    console.error('Fetch error:', {
      endpoint: url.pathname,
      timestamp: new Date().toISOString()
    });
    
    throw new ApiError(
      'Failed to fetch data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Filter out sensitive or tracking-related parameters
 */
function filterSensitiveParams(params: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'token',
    'key',
    'password',
    'secret',
    'auth',
    'session',
    'tracking',
    'analytics',
    'location',
    'device',
    'fingerprint',
    'uid',
    'uuid'
  ];

  return Object.fromEntries(
    Object.entries(params).filter(([key]) => 
      !sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    )
  );
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