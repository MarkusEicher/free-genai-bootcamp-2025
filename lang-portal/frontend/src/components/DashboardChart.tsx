import { Card } from './common'
import { Line } from 'react-chartjs-2'
import { usePerformanceHistory } from '../hooks/useApi'

interface PerformanceData {
  date: string
  score: number
  wordsLearned: number
}

export function DashboardChart() {
  const { data: history } = usePerformanceHistory()

  if (!history) return null

  const chartData = {
    labels: history.map((h: PerformanceData) => new Date(h.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Score',
        data: history.map((h: PerformanceData) => h.score * 100),
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1
      },
      {
        label: 'Words Learned',
        data: history.map((h: PerformanceData) => h.wordsLearned),
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.1
      }
    ]
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Learning Progress</h2>
      <div className="h-64">
        <Line
          data={chartData}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>
    </Card>
  )
} 