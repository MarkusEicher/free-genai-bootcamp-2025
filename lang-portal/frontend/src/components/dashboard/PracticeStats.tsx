import { Card } from '../common'
import { usePracticeStats } from '../../hooks/useApi'

export function PracticeStats() {
  const { data: stats } = usePracticeStats()

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Practice Performance</h2>
      <div className="space-y-4">
        {Object.entries(stats?.byMode || {}).map(([mode, data]) => (
          <div key={mode}>
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium">{mode}</div>
              <div className="text-sm text-gray-500">
                {Math.round(data.accuracy * 100)}% accuracy
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${data.accuracy * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 