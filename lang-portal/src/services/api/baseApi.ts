import { CustomError } from '@/utils/errors'

export class BaseApi {
  static async get<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new CustomError(
        response.status,
        'API_ERROR',
        'Failed to fetch data'
      )
    }
    return response.json()
  }

  static async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new CustomError(
        response.status,
        'API_ERROR',
        'Failed to post data'
      )
    }
    return response.json()
  }

  static async put<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new CustomError(
        response.status,
        'API_ERROR',
        'Failed to update data'
      )
    }
    return response.json()
  }

  static async delete(url: string): Promise<void> {
    const response = await fetch(url, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new CustomError(
        response.status,
        'API_ERROR',
        'Failed to delete data'
      )
    }
  }
} 