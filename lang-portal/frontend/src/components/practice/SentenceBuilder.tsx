import { useState } from 'react'
import { Card, Button } from '../common'
import type { VocabularyWord } from '../../types/vocabulary'

interface SentenceBuilderProps {
  word: VocabularyWord
  onAnswer: (correct: boolean) => void
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export function SentenceBuilder({ word, onAnswer, difficulty }: SentenceBuilderProps) {
  const [userSentence, setUserSentence] = useState('')
  const [showHint, setShowHint] = useState(false)

  const getSentenceTemplate = () => {
    switch (difficulty) {
      case 'beginner':
        return `Use "${word.word}" in a simple sentence.`
      case 'intermediate':
        return `Create a compound sentence using "${word.word}".`
      case 'advanced':
        return `Write a complex sentence incorporating "${word.word}" with proper context.`
    }
  }

  const checkSentence = () => {
    const containsWord = userSentence.toLowerCase().includes(word.word.toLowerCase())
    const hasMinLength = userSentence.split(' ').length >= getMinWordCount()
    onAnswer(containsWord && hasMinLength)
  }

  const getMinWordCount = () => {
    switch (difficulty) {
      case 'beginner': return 4
      case 'intermediate': return 6
      case 'advanced': return 8
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-lg font-medium">{getSentenceTemplate()}</div>
        <textarea
          value={userSentence}
          onChange={(e) => setUserSentence(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Write your sentence here..."
        />
        {showHint && word.examples && (
          <div className="text-sm text-gray-600">
            Example: {word.examples[0]}
          </div>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setShowHint(true)}
            disabled={showHint || !word.examples?.length}
          >
            Show Hint
          </Button>
          <Button
            onClick={checkSentence}
            disabled={userSentence.length < 10}
          >
            Check Sentence
          </Button>
        </div>
      </div>
    </Card>
  )
} 