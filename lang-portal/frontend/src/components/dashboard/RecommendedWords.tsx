import { Card } from '../common'
import { Link } from 'react-router-dom'
import { useRecommendedWords } from '../../hooks/useApi'
import type { VocabularyWord } from '../../types/vocabulary'

export function RecommendedWords() {
  const { data: words } = useRecommendedWords()

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Recommended Words</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {words?.map((word: VocabularyWord) => (
          <Link
            key={word.id}
            to={`/vocabulary/${word.id}`}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
          >
            <div className="font-medium">{word.word}</div>
            <div className="text-sm text-gray-600">{word.translation}</div>
          </Link>
        ))}
      </div>
    </Card>
  )
} 