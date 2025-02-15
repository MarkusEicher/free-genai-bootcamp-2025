import { Card } from './common'
import type { VocabularyWord } from '../types/vocabulary'

interface WordPracticeProps {
  word: VocabularyWord
}

export function WordPractice({ word }: WordPracticeProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Practice</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Practice Count</div>
          <div className="text-2xl font-bold">{word.practiceCount || 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Accuracy</div>
          <div className="text-2xl font-bold">{word.accuracy || 0}%</div>
        </div>
      </div>
    </Card>
  )
} 