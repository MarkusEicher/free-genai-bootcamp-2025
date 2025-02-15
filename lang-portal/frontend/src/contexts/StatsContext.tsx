import { createContext, useContext, ReactNode } from 'react'
import { useStats, useUpdateStats } from '../hooks/useApi'

interface Stats {
  wordsLearned: number
  currentStreak: number
  successRate: number
  totalMinutes: number
  recentActivity: Array<{
    type: string
    date: string
    details: string
  }>
}

interface StatsContextType {
  stats: Stats | null
  isLoading: boolean
  updateStats: (practiceResults: { correct: number; total: number; type: string }) => void
}

const StatsContext = createContext<StatsContextType | null>(null)

export function StatsProvider({ children }: { children: ReactNode }) {
  const { data: stats, isLoading } = useStats()
  const { mutateAsync: updateStatsMutation } = useUpdateStats()

  const updateStats = async (practiceResults: { correct: number; total: number; type: string }) => {
    const newStats = {
      ...stats,
      wordsLearned: (stats?.wordsLearned || 0) + practiceResults.correct,
      successRate: calculateNewSuccessRate(stats?.successRate || 0, practiceResults),
      recentActivity: [
        {
          type: practiceResults.type,
          date: new Date().toISOString(),
          details: `Completed with ${practiceResults.correct}/${practiceResults.total} correct`
        },
        ...(stats?.recentActivity || []).slice(0, 9)
      ]
    }
    
    await updateStatsMutation(newStats)
  }

  return (
    <StatsContext.Provider value={{ stats, isLoading, updateStats }}>
      {children}
    </StatsContext.Provider>
  )
}

export function useStatsContext() {
  const context = useContext(StatsContext)
  if (!context) {
    throw new Error('useStatsContext must be used within a StatsProvider')
  }
  return context
}

function calculateNewSuccessRate(currentRate: number, results: { correct: number; total: number }) {
  const currentWeight = 0.7 // Weight for historical data
  const newWeight = 0.3 // Weight for new results
  const newRate = (results.correct / results.total) * 100
  return (currentRate * currentWeight) + (newRate * newWeight)
} 