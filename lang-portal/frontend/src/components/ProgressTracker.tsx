import { Card } from './common'
import type { Goal } from '../types/goals'
import type { Session } from '../types/sessions'

interface ProgressTrackerProps {
  goals: Goal[]
  sessions: Session[]
}

export function ProgressTracker({ goals, sessions }: ProgressTrackerProps) {
  const calculateProgress = (goal: Goal) => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    
    const relevantSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime)
      if (goal.type === 'daily') {
        return sessionDate.toDateString() === today.toDateString()
      }
      return sessionDate >= startOfWeek
    })

    let current = 0
    switch (goal.metric) {
      case 'sessions':
        current = relevantSessions.length
        break
      case 'duration':
        current = Math.round(
          relevantSessions.reduce((sum, session) => sum + session.duration, 0) / 60
        )
        break
      case 'score':
        current = Math.round(
          relevantSessions.reduce((sum, session) => sum + session.score, 0) / 
          relevantSessions.length * 100
        )
        break
    }

    return {
      current,
      target: goal.target,
      percentage: Math.min(100, (current / goal.target) * 100)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Progress Tracking</h2>
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const progress = calculateProgress(goal)
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {goal.type === 'daily' ? 'Daily' : 'Weekly'} {goal.metric}:{' '}
                  {progress.current} / {progress.target}
                </span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
} 