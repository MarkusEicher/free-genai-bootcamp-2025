import { createContext, useContext, ReactNode } from 'react'
import { useDashboardStats } from '../hooks/useApi'

interface StatsContextType {
  stats: {
    success_rate: number
    study_sessions_count: number
    active_activities_count: number
    active_groups_count: number
    study_streak: {
      current_streak: number
      longest_streak: number
    }
  } | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const StatsContext = createContext<StatsContextType | undefined>(undefined)

export function StatsProvider({ children }: { children: ReactNode }) {
  const { data: stats, isLoading, isError, error } = useDashboardStats()

  return (
    <StatsContext.Provider value={{ stats, isLoading, isError, error }}>
      {children}
    </StatsContext.Provider>
  )
}

export function useStatsContext() {
  const context = useContext(StatsContext)
  if (context === undefined) {
    throw new Error('useStatsContext must be used within a StatsProvider')
  }
  return context
} 