import { Card } from '../common'

interface PracticeProgressProps {
  current: number
  total: number
  correct: number
}

export function PracticeProgress({ current, total, correct }: PracticeProgressProps) {
  return (
    <Card className="p-4">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <div>Progress: {current}/{total}</div>
        <div>Correct: {correct}/{current - 1}</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </Card>
  )
} 