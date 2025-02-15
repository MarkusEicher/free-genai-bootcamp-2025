import { Card } from './common'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { Session } from '../types/sessions'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ActivityAnalyticsProps {
  sessions: Session[]
}

export function ActivityAnalytics({ sessions }: ActivityAnalyticsProps) {
  // Aggregate activity data
  const activityStats = sessions.reduce((acc, session) => {
    session.activities.forEach(activity => {
      if (!acc[activity.name]) {
        acc[activity.name] = {
          count: 0,
          totalScore: 0,
          totalDuration: 0
        }
      }
      acc[activity.name].count += 1
      acc[activity.name].totalScore += activity.score
      acc[activity.name].totalDuration += activity.duration
    })
    return acc
  }, {} as Record<string, { count: number; totalScore: number; totalDuration: number }>)

  const activityNames = Object.keys(activityStats)
  const averageScores = activityNames.map(name => 
    (activityStats[name].totalScore / activityStats[name].count) * 100
  )

  const chartData = {
    labels: activityNames,
    datasets: [
      {
        data: averageScores,
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)'
        ]
      }
    ]
  }

  const options = {
    plugins: {
      legend: {
        position: 'right' as const
      },
      title: {
        display: true,
        text: 'Activity Performance Distribution'
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Activity Performance</h2>
        <div className="h-64">
          <Doughnut data={chartData} options={options} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activityNames.map(name => (
          <Card key={name} className="p-4">
            <h3 className="font-medium">{name}</h3>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-500">Sessions</div>
                <div className="font-medium">{activityStats[name].count}</div>
              </div>
              <div>
                <div className="text-gray-500">Avg. Score</div>
                <div className="font-medium">
                  {Math.round(activityStats[name].totalScore / activityStats[name].count * 100)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500">Total Time</div>
                <div className="font-medium">
                  {Math.round(activityStats[name].totalDuration / 60)}m
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 