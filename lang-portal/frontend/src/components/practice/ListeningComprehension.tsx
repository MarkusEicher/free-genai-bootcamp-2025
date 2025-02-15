import { useState, useRef } from 'react'
import { Card, Button } from '../common'
import type { VocabularyWord } from '../../types/vocabulary'

interface ListeningComprehensionProps {
  word: VocabularyWord
  onAnswer: (correct: boolean) => void
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export function ListeningComprehension({ word, onAnswer, difficulty }: ListeningComprehensionProps) {
  const [userInput, setUserInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const getMaxAttempts = () => {
    switch (difficulty) {
      case 'beginner': return 3
      case 'intermediate': return 2
      case 'advanced': return 1
    }
  }

  const getSpeechRate = () => {
    switch (difficulty) {
      case 'beginner': return 0.8
      case 'intermediate': return 1.0
      case 'advanced': return 1.2
    }
  }

  const playWord = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = getSpeechRate()
      audioRef.current.play()
    }
  }

  const checkAnswer = () => {
    const isCorrect = userInput.toLowerCase().trim() === word.word.toLowerCase().trim()
    if (!isCorrect && attempts < getMaxAttempts() - 1) {
      setAttempts(prev => prev + 1)
    } else {
      onAnswer(isCorrect)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-lg font-medium">
          Listen and type the word you hear
        </div>
        <audio
          ref={audioRef}
          src={`/api/tts/${encodeURIComponent(word.word)}`}
          className="hidden"
        />
        <div className="flex justify-center">
          <Button
            onClick={playWord}
            className="px-8"
          >
            Play Word
          </Button>
        </div>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Type what you hear..."
        />
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Attempts: {attempts + 1}/{getMaxAttempts()}
          </div>
          <Button
            onClick={checkAnswer}
            disabled={!userInput.length}
          >
            Check Answer
          </Button>
        </div>
      </div>
    </Card>
  )
} 