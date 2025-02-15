import { Card } from './common'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { Session } from '../types/sessions'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface AnalyticsProps {
  sessions: Session[]
  timeframe: 'week' | 'month' | 'all'
}

export function SessionAnalytics({ sessions, timeframe }: AnalyticsProps) {
  const chartData = {
    labels: sessions.map(s => new Date(s.startTime).toLocaleDateString()),
    datasets: [
      {
        label: 'Score',
        data: sessions.map(s => s.score * 100),
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1
      },
      {
        label: 'Duration (minutes)',
        data: sessions.map(s => s.duration / 60),
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.1
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Session Performance Trends'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  // Calculate trends
  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0
    const first = data[0]
    const last = data[data.length - 1]
    return ((last - first) / first) * 100
  }

  const scoreTrend = calculateTrend(sessions.map(s => s.score))
  const durationTrend = calculateTrend(sessions.map(s => s.duration))

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Performance Trends</h2>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Score Trend</h3>
          <div className={`text-lg font-medium ${
            scoreTrend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {scoreTrend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(scoreTrend))}%
          </div>
          <p className="text-sm text-gray-500">
            {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'Overall'}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Duration Trend</h3>
          <div className={`text-lg font-medium ${
            durationTrend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {durationTrend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(durationTrend))}%
          </div>
          <p className="text-sm text-gray-500">
            {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'Overall'}
          </p>
        </Card>
      </div>
    </div>
  )
} 