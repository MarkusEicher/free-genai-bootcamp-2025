import { Card } from './common'
import type { Session } from '../types/sessions'

interface SessionStatsProps {
  sessions: Session[]
}

export function SessionStats({ sessions }: SessionStatsProps) {
  const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0)
  const averageScore = sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length || 0
  const streak = calculateStreak(sessions)
  const totalSessions = sessions.length

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Learning Statistics</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Current Streak</div>
          <div className="text-2xl font-bold">{streak} days</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Sessions</div>
          <div className="text-2xl font-bold">{totalSessions}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Time</div>
          <div className="text-2xl font-bold">{Math.round(totalTime / 60)} hours</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Average Score</div>
          <div className="text-2xl font-bold">{Math.round(averageScore * 100)}%</div>
        </div>
      </div>
    </Card>
  )
}

function calculateStreak(sessions: Session[]): number {
  let streak = 0
  const today = new Date().toDateString()
  
  for (let i = 0; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].date).toDateString()
    const previousDate = i > 0
      ? new Date(sessions[i - 1].date).toDateString()
      : today
    
    const dayDiff = Math.abs(
      (new Date(sessionDate).getTime() - new Date(previousDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    
    if (dayDiff <= 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
} 