import { useState } from 'react'
import { Card, Button } from '../common'
import type { VocabularyWord } from '../../types/vocabulary'

interface TypingPracticeProps {
  word: VocabularyWord
  onAnswer: (correct: boolean) => void
}

export function TypingPractice({ word, onAnswer }: TypingPracticeProps) {
  const [input, setInput] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isCorrect = input.toLowerCase().trim() === word.translation.toLowerCase().trim()
    setShowAnswer(true)
    onAnswer(isCorrect)
  }

  return (
    <Card className="p-6">
      <div className="text-2xl font-bold text-center mb-4">{word.word}</div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Type translation..."
          disabled={showAnswer}
        />
        {!showAnswer && (
          <Button type="submit" className="w-full">
            Check
          </Button>
        )}
      </form>
    </Card>
  )
} 