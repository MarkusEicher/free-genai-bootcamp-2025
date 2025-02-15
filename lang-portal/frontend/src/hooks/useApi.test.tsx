import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useVocabulary, useSessions, useActivities, useSettings } from './useApi'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('API Hooks', () => {
  beforeEach(() => {
    const queryClient = new QueryClient()
    queryClient.clear()
  })

  it('useVocabulary returns vocabulary list', async () => {
    const { result } = renderHook(() => useVocabulary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].word).toBe('Hello')
  })

  it('useSessions returns sessions list', async () => {
    const { result } = renderHook(() => useSessions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].date).toBe('2024-03-15')
  })

  it('useActivities returns activities list', async () => {
    const { result } = renderHook(() => useActivities(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].title).toBe('Vocabulary Quiz')
  })

  it('useSettings returns settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.theme).toBe('light')
  })
}) 