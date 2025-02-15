import { useState } from 'react'
import { useStartPractice } from '../hooks/useApi'
import { useStatsContext } from '../contexts/StatsContext'
import { useNotification } from '../contexts/NotificationContext'
import LoadingState from '../components/LoadingState'
import Card from '../components/Card'
import DifficultySelect from '../components/practice/DifficultySelect'
import PracticeSession from '../components/practice/PracticeSession'

type PracticeMode = 'flashcard' | 'typing' | 'multipleChoice'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface PracticeConfig {
  mode: PracticeMode
  difficulty: Difficulty
  wordCount: number
  timeLimit?: number
}

export default function PracticePage() {
  const [config, setConfig] = useState<PracticeConfig | null>(null)
  const [session, setSession] = useState<{
    questions: Array<{
      id: number
      word: string
      translation: string
      options?: string[]
    }>
  } | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('beginner')

  const startPractice = useStartPractice()
  const { updateStats } = useStatsContext()
  const { showNotification } = useNotification()

  const handleStart = async (mode: PracticeMode) => {
    try {
      const difficultyOption = DIFFICULTY_OPTIONS.find(opt => opt.id === selectedDifficulty)!
      
      setConfig({
        mode,
        difficulty: selectedDifficulty,
        wordCount: difficultyOption.wordCount,
        timeLimit: difficultyOption.timeLimit
      })

      const result = await startPractice.mutateAsync({
        type: mode,
        difficulty: selectedDifficulty,
        wordCount: difficultyOption.wordCount
      })
      
      setSession(result)
    } catch (error) {
      showNotification('Failed to start practice session', 'error')
    }
  }

  const handleComplete = ({ correct, total }: { correct: number; total: number }) => {
    updateStats({
      correct,
      total,
      type: config?.mode || 'practice'
    })
    setSession(null)
    setConfig(null)
  }

  if (startPractice.isLoading) {
    return <LoadingState message="Preparing practice session..." />
  }

  if (session && config) {
    return (
      <PracticeSession
        mode={config.mode}
        questions={session.questions}
        timeLimit={config.timeLimit}
        onComplete={handleComplete}
        onExit={() => {
          setSession(null)
          setConfig(null)
        }}
      />
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Select Difficulty</h2>
          <DifficultySelect
            selected={selectedDifficulty}
            onSelect={(option) => setSelectedDifficulty(option.id)}
          />
        </div>

        <div>
          <h2 className="text-xl font-medium mb-4">Choose Practice Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleStart('flashcard')}
              className="p-4 bg-white border rounded-lg hover:border-blue-500"
            >
              <h3 className="font-medium mb-2">Flashcards</h3>
              <p className="text-sm text-gray-600">Practice with traditional flashcards</p>
            </button>
            <button
              onClick={() => handleStart('typing')}
              className="p-4 bg-white border rounded-lg hover:border-blue-500"
            >
              <h3 className="font-medium mb-2">Typing</h3>
              <p className="text-sm text-gray-600">Practice by typing translations</p>
            </button>
            <button
              onClick={() => handleStart('multipleChoice')}
              className="p-4 bg-white border rounded-lg hover:border-blue-500"
            >
              <h3 className="font-medium mb-2">Multiple Choice</h3>
              <p className="text-sm text-gray-600">Practice with multiple choice questions</p>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
} 