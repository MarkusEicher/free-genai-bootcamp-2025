import { Card } from './common'
import { useLearningStats } from '../hooks/useApi'

interface LearningStatsProps {
  userId: number
}

export function LearningStats({ userId }: LearningStatsProps) {
  const { data: stats } = useLearningStats(userId)

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Learning Stats</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Words Mastered</div>
          <div className="text-2xl font-bold">{stats?.masteredWords || 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Study Streak</div>
          <div className="text-2xl font-bold">{stats?.currentStreak || 0} days</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Practice Sessions</div>
          <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
        </div>
      </div>
    </Card>
  )
} 