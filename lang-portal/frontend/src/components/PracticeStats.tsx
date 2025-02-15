import { Card } from './common'

interface WordProgress {
  level: number
  nextReview: string
  history: {
    correct: boolean
  }[]
}

interface PracticeStatsProps {
  progress: WordProgress[]
}

export function PracticeStats({ progress }: PracticeStatsProps) {
  const totalWords = progress.length
  const masteredWords = progress.filter(p => p.level === 5).length
  const dueWords = progress.filter(p => new Date(p.nextReview) <= new Date()).length
  
  const averageAccuracy = progress.reduce((acc, p) => {
    const correct = p.history.filter((h: { correct: boolean }) => h.correct).length
    return acc + (correct / p.history.length || 0)
  }, 0) / totalWords

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Practice Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-500">Total Words</div>
          <div className="text-2xl font-bold">{totalWords}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Mastered</div>
          <div className="text-2xl font-bold">{masteredWords}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Due for Review</div>
          <div className="text-2xl font-bold">{dueWords}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Average Accuracy</div>
          <div className="text-2xl font-bold">{Math.round(averageAccuracy * 100)}%</div>
        </div>
      </div>
    </Card>
  )
} 