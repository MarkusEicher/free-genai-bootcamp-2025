import { useState } from 'react'
import { Card, Button } from '../common'
import type { VocabularyWord } from '../../types/vocabulary'

interface FlashcardProps {
  word: VocabularyWord
  onAnswer: (correct: boolean) => void
}

export function Flashcard({ word, onAnswer }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const handleFlip = () => {
    if (!showAnswer) {
      setIsFlipped(!isFlipped)
    }
  }

  const handleAnswer = (correct: boolean) => {
    setShowAnswer(true)
    onAnswer(correct)
  }

  return (
    <Card className="p-6">
      <div
        className="cursor-pointer min-h-[200px] flex items-center justify-center"
        onClick={handleFlip}
      >
        <div className="text-2xl font-bold text-center">
          {isFlipped ? word.translation : word.word}
        </div>
      </div>
      {isFlipped && !showAnswer && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => handleAnswer(false)}
          >
            Incorrect
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => handleAnswer(true)}
          >
            Correct
          </Button>
        </div>
      )}
    </Card>
  )
} 