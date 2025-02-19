import { createContext, useContext, ReactNode } from 'react'
import { useDashboardStats } from '../hooks/useApi'
import type { DashboardStats } from '../types/dashboard'

interface StatsContextType {
  stats: DashboardStats | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const StatsContext = createContext<StatsContextType | undefined>(undefined)

// Export as named function for Fast Refresh compatibility
export function StatsProvider({ children }: { children: ReactNode }) {
  const { data: stats, isLoading, isError, error } = useDashboardStats()

  const value = {
    stats: stats || null,
    isLoading,
    isError,
    error: error instanceof Error ? error : null
  }

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  )
}

// Export as named function for Fast Refresh compatibility
export function useStatsContext() {
  const context = useContext(StatsContext)
  if (context === undefined) {
    throw new Error('useStatsContext must be used within a StatsProvider')
  }
  return context
} 