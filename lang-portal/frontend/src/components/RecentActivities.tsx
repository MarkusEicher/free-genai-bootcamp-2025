import { Card } from './common'
import type { Session } from '../types/sessions'

interface RecentActivitiesProps {
  lastSession?: Session
}

export function RecentActivities({ lastSession }: RecentActivitiesProps) {
  if (!lastSession) return null

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Recent Activities</h2>
      <div className="space-y-4">
        {lastSession.activities.map(activity => (
          <div
            key={activity.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <h3 className="font-medium">{activity.name}</h3>
              <p className="text-sm text-gray-500">
                {Math.round(activity.duration / 60)} minutes
              </p>
            </div>
            <div className="text-lg font-medium">
              {Math.round(activity.score * 100)}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 