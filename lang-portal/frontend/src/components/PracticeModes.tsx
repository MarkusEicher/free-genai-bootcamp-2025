import { useState } from 'react'
import { Button } from './common'
import type { VocabularyWord } from '../types/vocabulary'
import { MultipleChoice } from './practice/MultipleChoice'
import { TypingPractice } from './practice/TypingPractice'
import { Flashcard } from './practice/Flashcard'
import { PracticeProgress } from './practice/PracticeProgress'
import { SentenceBuilder } from './practice/SentenceBuilder'
import { ListeningComprehension } from './practice/ListeningComprehension'

export type PracticeMode = 'typing' | 'multipleChoice' | 'flashcard' | 'sentenceBuilder' | 'listening'

interface PracticeModesProps {
  words: VocabularyWord[]
  mode: PracticeMode
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  onComplete: (results: { correct: number; total: number }) => void
}

export function PracticeModes({ words, mode, difficulty, onComplete }: PracticeModesProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [correct, setCorrect] = useState(0)

  const currentWord = words[currentWordIndex]

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) setCorrect(prev => prev + 1)
    
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
    } else {
      onComplete({ correct, total: words.length })
    }
  }

  const generateOptions = (word: VocabularyWord, allWords: VocabularyWord[]): string[] => {
    const options = new Set([word.translation])
    while (options.size < 4) {
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)]
      options.add(randomWord.translation)
    }
    return Array.from(options).sort(() => Math.random() - 0.5)
  }

  if (!mode) {
    return (
      <div className="space-y-4">
        <Button
          className="w-full"
          onClick={() => onComplete({ correct: 0, total: 0 })}
        >
          Back to Mode Selection
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PracticeProgress
        current={currentWordIndex + 1}
        total={words.length}
        correct={correct}
      />

      {mode === 'typing' && (
        <TypingPractice
          word={currentWord}
          onAnswer={handleAnswer}
        />
      )}

      {mode === 'multipleChoice' && (
        <MultipleChoice
          word={currentWord}
          options={generateOptions(currentWord, words)}
          onAnswer={handleAnswer}
        />
      )}

      {mode === 'flashcard' && (
        <Flashcard
          word={currentWord}
          onAnswer={handleAnswer}
        />
      )}

      {mode === 'sentenceBuilder' && (
        <SentenceBuilder
          word={currentWord}
          onAnswer={handleAnswer}
          difficulty={difficulty}
        />
      )}

      {mode === 'listening' && (
        <ListeningComprehension
          word={currentWord}
          onAnswer={handleAnswer}
          difficulty={difficulty}
        />
      )}
    </div>
  )
} 