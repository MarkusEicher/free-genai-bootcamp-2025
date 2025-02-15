import { useState } from 'react'
import { Card, Button } from '../common'
import type { VocabularyWord } from '../../types/vocabulary'

interface MultipleChoiceProps {
  word: VocabularyWord
  options: string[]
  onAnswer: (correct: boolean) => void
}

export function MultipleChoice({ word, options, onAnswer }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  const handleSubmit = () => {
    if (!selected) return
    const isCorrect = selected === word.translation
    setShowAnswer(true)
    onAnswer(isCorrect)
  }

  return (
    <Card className="p-6">
      <div className="text-2xl font-bold text-center mb-4">{word.word}</div>
      <div className="space-y-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => !showAnswer && setSelected(option)}
            className={`w-full p-3 rounded border ${
              showAnswer
                ? option === word.translation
                  ? 'bg-green-100 border-green-500'
                  : option === selected
                  ? 'bg-red-100 border-red-500'
                  : 'border-gray-200'
                : selected === option
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
            disabled={showAnswer}
          >
            {option}
          </button>
        ))}
      </div>
      {!showAnswer && (
        <Button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full mt-4"
        >
          Check Answer
        </Button>
      )}
    </Card>
  )
} 