import { useState, useEffect } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import Button from '../Button'
import Card from '../Card'
import PracticeResult from './PracticeResult'

interface PracticeQuestion {
  id: number
  word: string
  translation: string
  options?: string[]
}

interface PracticeSessionProps {
  mode: 'flashcard' | 'typing' | 'multipleChoice'
  questions: PracticeQuestion[]
  timeLimit?: number
  onComplete: (results: { correct: number; total: number }) => void
  onExit: () => void
}

export default function PracticeSession({ mode, questions, timeLimit, onComplete, onExit }: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit || 0)
  
  const { showNotification } = useNotification()
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  useEffect(() => {
    if (!timeLimit) return
    
    if (timeLeft === 0) {
      handleAnswer(false)
      return
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft, timeLimit])

  const handleAnswer = (isCorrect: boolean) => {
    const newResults = [...results, isCorrect]
    setResults(newResults)
    
    showNotification(
      isCorrect ? 'Correct!' : `Incorrect. The answer was: ${currentQuestion.translation}`,
      isCorrect ? 'success' : 'error'
    )
    
    if (isLastQuestion) {
      setShowResults(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setAnswer('')
      setShowAnswer(false)
    }
  }

  const checkAnswer = () => {
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.translation.toLowerCase().trim()
    handleAnswer(isCorrect)
  }

  const renderContent = () => {
    switch (mode) {
      case 'flashcard':
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">{currentQuestion.word}</h3>
            {showAnswer ? (
              <>
                <p className="text-xl mb-8">{currentQuestion.translation}</p>
                <div className="space-x-4">
                  <Button onClick={() => handleAnswer(false)} variant="secondary">
                    Incorrect
                  </Button>
                  <Button onClick={() => handleAnswer(true)}>
                    Correct
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => setShowAnswer(true)}>
                Show Answer
              </Button>
            )}
          </div>
        )

      case 'typing':
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">{currentQuestion.word}</h3>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full max-w-md mx-auto p-2 border rounded mb-4"
              placeholder="Type the translation..."
            />
            <Button onClick={checkAnswer}>
              Check Answer
            </Button>
          </div>
        )

      case 'multipleChoice':
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">{currentQuestion.word}</h3>
            <div className="space-y-4">
              {currentQuestion.options?.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(option === currentQuestion.translation)}
                  className="w-full max-w-md"
                  variant="secondary"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )
    }
  }

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <PracticeResult
          correct={results.filter(r => r).length}
          total={questions.length}
          onContinue={() => onComplete({ 
            correct: results.filter(r => r).length, 
            total: questions.length 
          })}
          onRetry={() => {
            setCurrentIndex(0)
            setResults([])
            setShowResults(false)
            setAnswer('')
            setShowAnswer(false)
          }}
        />
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </div>
        {timeLimit && (
          <div className="text-sm text-gray-500">
            Time left: {timeLeft}s
          </div>
        )}
        <Button onClick={onExit} variant="secondary">
          Exit Practice
        </Button>
      </div>

      {renderContent()}

      <div className="mt-8 h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-blue-500 rounded-full transition-all"
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>
    </Card>
  )
} 