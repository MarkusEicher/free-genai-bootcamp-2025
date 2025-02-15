import { Card } from './common'
import { useUserStats } from '../hooks/useApi'

interface ProfileStatsProps {
  userId: number
}

export function ProfileStats({ userId }: ProfileStatsProps) {
  const { data: stats, isLoading } = useUserStats(userId)

  if (isLoading) return <div>Loading...</div>

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-500">Words Learned</div>
          <div className="text-2xl font-bold">{stats?.wordsLearned || 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Practice Sessions</div>
          <div className="text-2xl font-bold">{stats?.practiceSessions || 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Average Accuracy</div>
          <div className="text-2xl font-bold">{stats?.averageAccuracy || 0}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Study Time</div>
          <div className="text-2xl font-bold">{stats?.totalStudyTime || 0}m</div>
        </div>
      </div>
    </Card>
  )
} 