import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { useState } from 'react'

interface StatPoint {
  date: string
  score: number
  timeSpent: number
  attempts: number
  correctAnswers: number
  totalQuestions: number
}

interface StatisticsChartProps {
  data: StatPoint[]
  metric: 'score' | 'timeSpent' | 'accuracy'
  chartType?: 'area' | 'bar'
}

export default function StatisticsChart({ 
  data, 
  metric, 
  chartType: initialChartType = 'area' 
}: StatisticsChartProps) {
  const [chartType, setChartType] = useState(initialChartType)

  const getChartColor = (metric: string) => {
    switch (metric) {
      case 'score': return { stroke: '#3b82f6', fill: '#93c5fd' }
      case 'timeSpent': return { stroke: '#8b5cf6', fill: '#c4b5fd' }
      case 'accuracy': return { stroke: '#10b981', fill: '#6ee7b7' }
      default: return { stroke: '#3b82f6', fill: '#93c5fd' }
    }
  }

  const formatValue = (value: number): string => {
    switch (metric) {
      case 'score': return `${value}%`
      case 'timeSpent': return `${value} min`
      case 'accuracy': return `${value}%`
      default: return value.toString()
    }
  }

  const calculateAccuracy = (point: StatPoint) => 
    point.totalQuestions > 0 
      ? (point.correctAnswers / point.totalQuestions) * 100 
      : 0

  const chartData = data.map(point => ({
    ...point,
    accuracy: calculateAccuracy(point)
  }))

  const renderChart = () => {
    const colors = getChartColor(metric)
    const ChartComponent = chartType === 'area' ? AreaChart : BarChart

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
          />
          <YAxis
            domain={metric === 'timeSpent' ? [0, 'auto'] : [0, 100]}
            tickFormatter={formatValue}
          />
          <Tooltip
            formatter={(value: number) => formatValue(value)}
            labelFormatter={(date) => format(new Date(date), 'PPP')}
          />
          <Legend />
          {chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey={metric}
              name={metric === 'timeSpent' ? 'Time Spent' : 
                    metric === 'accuracy' ? 'Accuracy' : 'Score'}
              stroke={colors.stroke}
              fill={colors.fill}
            />
          ) : (
            <Bar
              dataKey={metric}
              name={metric === 'timeSpent' ? 'Time Spent' : 
                    metric === 'accuracy' ? 'Accuracy' : 'Score'}
              stroke={colors.stroke}
              fill={colors.fill}
            />
          )}
          {metric === 'score' && chartType === 'area' && (
            <Area
              type="monotone"
              dataKey="accuracy"
              name="Accuracy"
              stroke="#10b981"
              fill="#6ee7b7"
              opacity={0.5}
            />
          )}
          {metric === 'score' && chartType === 'bar' && (
            <Bar
              dataKey="accuracy"
              name="Accuracy"
              stroke="#10b981"
              fill="#6ee7b7"
              opacity={0.5}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h4 className="font-medium">
            {metric === 'timeSpent' ? 'Time Spent' : 
             metric === 'accuracy' ? 'Accuracy' : 'Score'} History
          </h4>
          {data.length > 0 && (
            <div className="text-sm text-gray-600">
              Average: {formatValue(
                data.reduce((acc, point) => 
                  acc + (metric === 'accuracy' ? calculateAccuracy(point) : point[metric]), 
                0) / data.length
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded text-sm ${
              chartType === 'area' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded text-sm ${
              chartType === 'bar' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
            }`}
          >
            Bar
          </button>
        </div>
      </div>
      <div className="h-64 bg-white rounded-lg p-4">
        {renderChart()}
      </div>
    </div>
  )
} 