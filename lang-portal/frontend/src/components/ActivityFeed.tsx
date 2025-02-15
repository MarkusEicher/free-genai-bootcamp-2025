import type { Activity } from '../types/dashboard'

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
          <div>
            <div className="text-sm">{activity.description}</div>
            <div className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'practice':
      return '📝'
    case 'word_added':
      return '➕'
    case 'group_created':
      return '📁'
    case 'achievement_earned':
      return '🏆'
    default:
      return '📌'
  }
} 