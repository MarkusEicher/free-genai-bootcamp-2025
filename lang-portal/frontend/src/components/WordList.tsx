import { Link } from 'react-router-dom'
import { Card } from './common'
import type { VocabularyWord } from '../types/vocabulary'

interface WordListProps {
  words: VocabularyWord[]
}

export function WordList({ words }: WordListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Words</h2>
      {words.map(word => (
        <Link key={word.id} to={`/vocabulary/words/${word.id}`}>
          <Card className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{word.word}</div>
                <div className="text-sm text-gray-600">{word.translation}</div>
              </div>
              <div className="text-sm text-gray-500">
                {word.accuracy ? `${word.accuracy}% accuracy` : 'Not practiced'}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
} 