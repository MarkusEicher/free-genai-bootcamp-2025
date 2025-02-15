import { Line } from 'react-chartjs-2'
import type { ProgressDataPoint } from '../types/dashboard'

interface ProgressChartProps {
  data: ProgressDataPoint[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Mastered Words',
        data: data.map(d => d.masteredWords),
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1
      },
      {
        label: 'Total Words',
        data: data.map(d => d.totalWords),
        borderColor: 'rgb(156, 163, 175)',
        tension: 0.1
      }
    ]
  }

  return (
    <div className="h-64">
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }}
      />
    </div>
  )
} 