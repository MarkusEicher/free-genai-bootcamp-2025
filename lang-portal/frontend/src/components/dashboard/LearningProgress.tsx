import { Card } from '../common'
import { useStats } from '../../hooks/useApi'

export function LearningProgress() {
  const { data: stats } = useStats()

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Learning Progress</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-500">Words Learned</div>
          <div className="text-2xl font-bold">{stats?.totalWords || 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Mastery Level</div>
          <div className="text-2xl font-bold">
            {stats?.masteryPercentage ? `${Math.round(stats.masteryPercentage)}%` : '0%'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Study Streak</div>
          <div className="text-2xl font-bold">{stats?.currentStreak || 0} days</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Practice Time</div>
          <div className="text-2xl font-bold">{Math.round((stats?.totalPracticeTime || 0) / 60)}h</div>
        </div>
      </div>
    </Card>
  )
} 