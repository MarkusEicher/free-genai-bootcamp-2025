import { Card } from '../common'
import { useActivityHistory } from '../../hooks/useApi'

export function ActivityChart() {
  const { data: activities } = useActivityHistory()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeks = 12 // Show last 12 weeks

  const getActivityLevel = (count: number): string => {
    if (count === 0) return 'bg-gray-100'
    if (count < 3) return 'bg-green-200'
    if (count < 5) return 'bg-green-300'
    return 'bg-green-400'
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Activity History</h2>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div className="space-y-2">
          {days.map(day => (
            <div key={day} className="text-xs text-gray-500 h-4">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: weeks * 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 rounded ${getActivityLevel(activities?.[i]?.count || 0)}`}
              title={activities?.[i]?.count 
                ? `${activities[i].count} activities on ${activities[i].date}`
                : 'No activities'
              }
            />
          ))}
        </div>
      </div>
    </Card>
  )
} 