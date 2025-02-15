import { Card } from './common'
import type { Session } from '../types/sessions'

interface ComparisonProps {
  currentSession: Session
  previousSession: Session
}

export function SessionComparison({ currentSession, previousSession }: ComparisonProps) {
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(Math.round(change)),
      direction: change >= 0 ? 'increase' : 'decrease'
    }
  }

  const metrics = [
    {
      label: 'Score',
      current: currentSession.score * 100,
      previous: previousSession.score * 100,
      format: (value: number) => `${Math.round(value)}%`
    },
    {
      label: 'Duration',
      current: currentSession.duration / 60,
      previous: previousSession.duration / 60,
      format: (value: number) => `${Math.round(value)}m`
    },
    {
      label: 'Activities',
      current: currentSession.activitiesCompleted,
      previous: previousSession.activitiesCompleted,
      format: (value: number) => value.toString()
    }
  ]

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Comparison with Previous Session</h2>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map(metric => {
          const change = calculateChange(metric.current, metric.previous)
          return (
            <div key={metric.label}>
              <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
              <div className="mt-1">
                <div className="text-2xl font-semibold">
                  {metric.format(metric.current)}
                </div>
                <div className={`text-sm ${
                  change.direction === 'increase' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {change.direction === 'increase' ? '↑' : '↓'} {change.value}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
} 