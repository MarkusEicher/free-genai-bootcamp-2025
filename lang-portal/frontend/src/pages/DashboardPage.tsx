import { Card } from '../components/common'
import { useDashboardStats, useRecentActivity } from '../hooks/useApi'
import { ProgressChart } from '../components/ProgressChart'
import { ActivityFeed } from '../components/ActivityFeed'
import { LearningStreak } from '../components/LearningStreak'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activity, isLoading: activityLoading } = useRecentActivity()

  if (statsLoading || activityLoading) return <div>Loading...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Overall Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Words Mastered</div>
              <div className="text-2xl font-bold">{stats?.masteredWords || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Words</div>
              <div className="text-2xl font-bold">{stats?.totalWords || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Mastery Rate</div>
              <div className="text-2xl font-bold">
                {stats?.masteryRate ? `${Math.round(stats.masteryRate)}%` : '0%'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Learning Streak</h2>
          <LearningStreak
            currentStreak={stats?.currentStreak || 0}
            longestStreak={stats?.longestStreak || 0}
            lastActivity={stats?.lastActivityDate}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Practice Stats</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Average Accuracy</div>
              <div className="text-2xl font-bold">
                {stats?.averageAccuracy ? `${Math.round(stats.averageAccuracy)}%` : '0%'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Time Practiced</div>
              <div className="text-2xl font-bold">{stats?.totalPracticeTime || 0} min</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Progress Over Time</h2>
          <ProgressChart data={stats?.progressData || []} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <ActivityFeed activities={activity || []} />
        </Card>
      </div>
    </div>
  )
} 