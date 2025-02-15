import { useState } from 'react'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useSessions, useSessionStats } from '../hooks/useApi'
import type { Session } from '../types/sessions'
import { useStreakNotification } from '../hooks/useStreakNotification'
import { SessionAnalytics } from '../components/SessionAnalytics'
import { ActivityAnalytics } from '../components/ActivityAnalytics'
import { AchievementsDisplay } from '../components/AchievementsDisplay'

export default function SessionsPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week')
  const { data: sessions, isLoading, isError } = useSessions(timeframe)
  const { data: stats } = useSessionStats()
  useStreakNotification()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div>Error loading sessions</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Current Streak</h3>
          <p className="mt-2 text-3xl font-bold">
            {stats?.currentStreak || 0} days
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Best Streak</h3>
          <p className="mt-2 text-3xl font-bold">
            {stats?.bestStreak || 0} days
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="mt-2 text-3xl font-bold">
            {stats?.totalSessions || 0}
          </p>
        </Card>
      </div>

      {/* Analytics Sections */}
      {sessions && sessions.length > 0 && (
        <>
          <SessionAnalytics
            sessions={sessions}
            timeframe={timeframe}
          />
          <ActivityAnalytics sessions={sessions} />
        </>
      )}

      <AchievementsDisplay />

      {/* Timeframe Filter */}
      <div className="flex gap-2">
        <Button
          variant={timeframe === 'week' ? 'primary' : 'secondary'}
          onClick={() => setTimeframe('week')}
        >
          This Week
        </Button>
        <Button
          variant={timeframe === 'month' ? 'primary' : 'secondary'}
          onClick={() => setTimeframe('month')}
        >
          This Month
        </Button>
        <Button
          variant={timeframe === 'all' ? 'primary' : 'secondary'}
          onClick={() => setTimeframe('all')}
        >
          All Time
        </Button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions?.map((session: Session) => (
          <Card key={session.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  {new Date(session.startTime).toLocaleDateString()}
                </h3>
                <p className="text-sm text-gray-500">
                  Duration: {Math.round(session.duration / 60)} minutes
                </p>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  Score: {Math.round(session.score * 100)}%
                </div>
                <p className="text-sm text-gray-500">
                  {session.activitiesCompleted} activities
                </p>
              </div>
            </div>

            {/* Activities List */}
            <div className="mt-4 space-y-2">
              {session.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span>{activity.name}</span>
                  <span className="text-sm">
                    {Math.round(activity.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {sessions?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No sessions found for this timeframe</p>
          </div>
        )}
      </div>
    </div>
  )
} 