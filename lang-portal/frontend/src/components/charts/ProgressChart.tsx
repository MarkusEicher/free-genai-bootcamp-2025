import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ProgressChartProps {
  data: {
    dates: string[]
    wordsLearned: number[]
    successRate: number[]
  }
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const chartData: ChartData<'line'> = {
    labels: data.dates,
    datasets: [
      {
        label: 'Words Learned',
        data: data.wordsLearned,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y'
      },
      {
        label: 'Success Rate (%)',
        data: data.successRate,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Words Learned'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Success Rate (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div className="w-full h-64">
      <Line options={options} data={chartData} />
    </div>
  )
} 